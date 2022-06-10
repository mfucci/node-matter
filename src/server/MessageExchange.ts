import { Message, MessageCodec } from "../codec/MessageCodec";
import { Queue } from "../util/Queue";
import { Session } from "../session/Session";
import { ExchangeSocket, MessageCounter } from "./MatterServer";
import { MessageType } from "../session/secure/SecureChannelMessages";

class MessageChannel implements ExchangeSocket<Message> {
    constructor(
        readonly channel: ExchangeSocket<Buffer>,
        private readonly session: Session,
    ) {}

    send(message: Message): Promise<void> {
        const packet = this.session.encode(message);
        const bytes = MessageCodec.encodePacket(packet);
        return this.channel.send(bytes);
    }

    getName() {
        return `${this.channel.getName()} on session ${this.session.getName()}`;
    }
}

export class MessageExchange {
    private readonly messageCodec = new MessageCodec();
    readonly channel: MessageChannel;
    private sentMessageToAck: Message | undefined;
    private retransmissionTimeoutId:  NodeJS.Timeout | undefined;
    private activeRetransmissionTimeoutMs: number;
    private retransmissionRetries: number;
    private receivedMessageToAck: Message | undefined;
    private messagesQueue = new Queue<Message>();

    constructor(
        readonly session: Session,
        channel: ExchangeSocket<Buffer>,
        private readonly messageCounter: MessageCounter,
        private readonly initialMessage: Message,
        private readonly closeCallback: () => void,
    ) {
        this.channel = new MessageChannel(channel, session);
        this.receivedMessageToAck = initialMessage.payloadHeader.requiresAck ? initialMessage : undefined;
        this.messagesQueue.write(initialMessage);
        const {activeRetransmissionTimeoutMs: activeRetransmissionTimeoutMs, retransmissionRetries} = session.getMrpParameters();
        this.activeRetransmissionTimeoutMs = activeRetransmissionTimeoutMs;
        this.retransmissionRetries = retransmissionRetries;
    }

    static fromInitialMessage(
        session: Session,
        channel: ExchangeSocket<Buffer>,
        messageCounter: MessageCounter,
        initialMessage: Message,
        closeCallback: () => void,
    ) {
        return new MessageExchange(
            session,
            channel,
            messageCounter,
            initialMessage,
            closeCallback,
        );
    }

    onMessageReceived(message: Message) {
        const { packetHeader: { messageId }, payloadHeader: { requiresAck, ackedMessageId, messageType } } = message;

        if (messageId === this.receivedMessageToAck?.packetHeader.messageId) {
            // Received a message retransmission but the reply is not ready yet, ignoring
            return;
        }
        if (messageId === this.sentMessageToAck?.payloadHeader.ackedMessageId) {
            // Received a message retransmission, this means that the other side didn't get our ack
            // Resending the previously reply message which contains the ack
            this.channel.send(this.sentMessageToAck);
            return;
        }
        if (ackedMessageId !== undefined && this.sentMessageToAck === undefined) throw new Error(`Received ack for message ${ackedMessageId.toString(16)} but no sent message required an ack`);
        if (this.sentMessageToAck !== undefined) {
            if (ackedMessageId === undefined) throw new Error("Previous message ack is missing");
            const expectedAckMessageId = this.sentMessageToAck.packetHeader.messageId
            if (ackedMessageId !== expectedAckMessageId) throw new Error(`Received incorrect ack: expected ${expectedAckMessageId.toString(16)}, received ${ackedMessageId.toString(16)}`);
            // The other side has received our previous message
            this.sentMessageToAck = undefined;
            clearTimeout(this.retransmissionTimeoutId);
        }
        if (messageType === MessageType.StandaloneAck) {
            // This indicates the end of this message exchange
            if (requiresAck) throw new Error("Standalone acks should bot require an ack");
            this.messagesQueue.close();
            this.closeCallback();
            return;
        }
        if (requiresAck) {
            this.receivedMessageToAck = message;
        }
        this.messagesQueue.write(message);
    }

    send(messageType: number, payload: Buffer) {
        if (this.sentMessageToAck !== undefined) throw new Error("The previous message has not been acked yet, cannot send a new message");
        const { packetHeader: { sessionId, sessionType, destNodeId, sourceNodeId }, payloadHeader: { exchangeId, protocolId } } = this.initialMessage;
        const message = {
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
                requiresAck: true,
                ackedMessageId: this.receivedMessageToAck?.packetHeader.messageId,
            },
            payload,
        };
        this.receivedMessageToAck = undefined;
        this.sentMessageToAck = message;
        this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, 0), this.activeRetransmissionTimeoutMs);

        return this.channel.send(message);
    }

    nextMessage() {
        return this.messagesQueue.read();
    }

    getInitialMessageType() {
        return this.initialMessage.payloadHeader.messageType;
    }

    async waitFor(messageType: number) {
        const message = await this.messagesQueue.read();
        const { payloadHeader: { messageType: receivedMessageType } } = message;
        if (receivedMessageType !== messageType)
            throw new Error(`Received unexpected message type ${receivedMessageType.toString(16)}. Expected ${messageType.toString(16)}`);
        return message;
    }

    private retransmitMessage(message: Message, retransmissionCount: number) {
        this.channel.send(message);
        retransmissionCount++;
        if (retransmissionCount === this.retransmissionRetries) return;
        this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, retransmissionCount), this.activeRetransmissionTimeoutMs);
    }
}
