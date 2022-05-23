import { Crypto } from "../crypto/Crypto";
import { Message, MessageCodec, SessionType } from "../codec/Message";
import { PakeCommissioner } from "../commission/PakeCommissioner";
import { Channel } from "./Channel";
import { Queue } from "../util/Queue";
import { getSessionManager, Session } from "../session/SessionManager";

export const UNDEFINED_NODE_ID = BigInt(0);

const enum Protocol {
    SECURE_CHANNEL = 0x0000,
    INTERACTION_MODEL = 0x0001,
    BULK_DATA_EXCHANGE = 0x0002,
}

export class Dispatcher {
    private readonly messageCounter = new MessageCounter();
    private readonly exchanges = new Map<number, MessageExchange>();
    private readonly sessionManager = getSessionManager();

    private readonly spake = new PakeCommissioner(
        20202021,
        { iteration: 1000, salt: Crypto.getRandomData(32) },
    );

    onMessage(channel: Channel<Buffer>, messageBytes: Buffer) {
        var packet = MessageCodec.decodePacket(messageBytes);
        if (packet.header.sessionType === SessionType.Group) throw new Error("Group messages are not supported");

        const session = this.sessionManager.getSession(packet.header.sessionId);
        if (session === undefined) throw new Error(`Cannot find a session for ID ${packet.header.sessionId}`);

        const message = session.decode(packet);
        const exchangeId = message.payloadHeader.exchangeId;
        if (this.exchanges.has(exchangeId)) {
            const exchange = this.exchanges.get(exchangeId);
            exchange?.onMessageReceived(message);
        } else {
            const exchange = MessageExchange.fromInitialMessage(this.messageCounter, new MessageChannel(channel, session), message);
            this.exchanges.set(exchangeId, exchange);
            switch (message.payloadHeader.protocolId) {
                case Protocol.SECURE_CHANNEL:
                    this.spake.onNewExchange(exchange);
                    break;
                default:
                    throw new Error(`Unsupported protocol ${message.payloadHeader.protocolId}`);
            }
        }
    }
}

export interface ExchangeHandler {
    onNewExchange(exchange: MessageExchange): void;
}

export class MessageChannel implements Channel<Message> {
    constructor(
        private readonly channel: Channel<Buffer>,
        private readonly session: Session,
    ) {}

    send(message: Message): Promise<void> {
        const packet = this.session.encode(message);
        const bytes = MessageCodec.encodePacket(packet);
        return this.channel.send(bytes);
    }
}

export class MessageCounter {
    private messageCounter = Crypto.getRandomUInt32();

    getIncrementedCounter() {
        this.messageCounter++;
        if (this.messageCounter > 0xFFFFFFFF) {
            this.messageCounter = 0;
        }
        return this.messageCounter;
    }
}

export class MessageExchange {
    private readonly messageCodec = new MessageCodec();
    private ackedMessageId: number | undefined;
    private messagesQueue = new Queue<Message>();

    constructor(
        private readonly channel: MessageChannel,
        private readonly messageCounter: MessageCounter,
        private readonly initialMessage: Message,
    ) {
        this.ackedMessageId = initialMessage.payloadHeader.requiresAck ? initialMessage.packetHeader.messageId : undefined;
        this.messagesQueue.write(initialMessage);
    }

    static fromInitialMessage(
            messageCounter: MessageCounter,
            channel: MessageChannel,
            initialMessage: Message) {
        return new MessageExchange(
            channel,
            messageCounter,
            initialMessage,
        )
    }

    onMessageReceived(message: Message) {
        const {packetHeader: {messageId}, payloadHeader: {requiresAck} } = message;
        // TODO: ensure all other parameters valid
        if (requiresAck) {
            this.ackedMessageId = messageId;
        }
        this.messagesQueue.write(message);
    }
    
    send(messageType: number, payload: Buffer, lastMessage: boolean = false) {
        const { packetHeader: { sessionId, sessionType, destNodeId, sourceNodeId }, payloadHeader: { exchangeId, protocolId } } = this.initialMessage;
        return this.channel.send({
            packetHeader: {
                sessionId,
                sessionType,
                messageId: this.messageCounter.getIncrementedCounter(),
                destNodeId: sourceNodeId,
                sourceNodeId: destNodeId,
            },
            payloadHeader: {
                exchangeId,
                protocolId,
                messageType,
                isInitiatorMessage: false,
                requiresAck: !lastMessage,
                ackedMessageId: this.ackedMessageId,
            },
            payload,
        });
    }

    nextMessage() {
        return this.messagesQueue.read();
    }

    async waitFor(messageType: number) {
        const message = await this.messagesQueue.read();
        const { payloadHeader: { messageType: receivedMessageType }} = message;
        if (receivedMessageType !== messageType) throw new Error(`Received unexpected message type ${receivedMessageType.toString(16)}. Expected ${messageType.toString(16)}`);
        return message;
    }
}
