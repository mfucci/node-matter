import { Message, MessageCodec, SessionType } from "../codec/MessageCodec";
import { Queue } from "../util/Queue";
import { MessageCounter } from "./MessageCounter";
import { MessageType } from "../session/secure/SecureChannelMessages";
import { Stream } from "../util/Stream";
import { SecureMessage } from "../session/SecureMessage";
import { Session } from "../session/Session";

export interface MessageExchangeConfig {
    session: Session,
    sessionId: number,
    sessionType: SessionType,
    destNodeId?: bigint,
    sourceNodeId?: bigint,
    exchangeId: number,
    protocolId: number,
    activeRetransmissionTimeoutMs: number,
    retransmissionRetries: number,
}

export class MessageExchange {
    private readonly messageCodec = new MessageCodec();
    private sentMessageToAck: Message | undefined;
    private retransmissionTimeoutId:  NodeJS.Timeout | undefined;
    private receivedMessageToAck: Message | undefined;
    private messagesQueue = new Queue<Message>();

    constructor(
        private readonly config: MessageExchangeConfig,
        private readonly messageStream: Stream<SecureMessage>,
        private readonly messageCounter: MessageCounter,
        private readonly closeCallback: () => void,
    ) {}

    onMessageReceived(message: Message) {
        const { packetHeader: { messageId }, payloadHeader: { requiresAck, ackedMessageId, messageType } } = message;

        if (messageId === this.receivedMessageToAck?.packetHeader.messageId) {
            // Received a message retransmission but the reply is not ready yet, ignoring
            // TODO: send a standalone ack if ack is requested
            return;
        }
        if (messageId === this.sentMessageToAck?.payloadHeader.ackedMessageId) {
            // Received a message retransmission, this means that the other side didn't get our ack
            // Resending the previously reply message which contains the ack
            this.messageStream.write({session: this.config.session, message: this.sentMessageToAck});
            return;
        }
        if (ackedMessageId !== undefined && this.sentMessageToAck?.packetHeader.messageId !== ackedMessageId) {
            // Received an unexpected ack, might be for a message retransmission, ignoring
            return;
        }
        if (this.sentMessageToAck !== undefined) {
            if (ackedMessageId === undefined) throw new Error("Previous message ack is missing");
            // The other side has received our previous message
            this.sentMessageToAck = undefined;
            clearTimeout(this.retransmissionTimeoutId);
        }
        if (messageType === MessageType.StandaloneAck) {
            // This indicates the end of this message exchange
            if (requiresAck) throw new Error("Standalone acks should but require an ack");
            // Wait some time before closing this exchange to handle potential retransmissions
            setTimeout(() => this.closeExchange(), this.config.activeRetransmissionTimeoutMs * 3);
            return;
        }
        if (requiresAck) {
            this.receivedMessageToAck = message;
        }
        this.messagesQueue.write(message);
    }

    async send(messageType: number, payload: Buffer) {
        if (this.sentMessageToAck !== undefined) throw new Error("The previous message has not been acked yet, cannot send a new message");
        const { session, sessionId, sessionType, destNodeId, sourceNodeId, exchangeId, protocolId } = this.config;
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
        this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, 0), this.config.activeRetransmissionTimeoutMs);

        await this.messageStream.write({session, message});
    }

    nextMessage() {
        return this.messagesQueue.read();
    }

    toString() {
        return `exchange ${this.config.exchangeId} with ${this.messageStream}`;
    }

    async waitFor(messageType: number) {
        const message = await this.messagesQueue.read();
        const { payloadHeader: { messageType: receivedMessageType } } = message;
        if (receivedMessageType !== messageType)
            throw new Error(`Received unexpected message type ${receivedMessageType.toString(16)}. Expected ${messageType.toString(16)}`);
        return message;
    }

    private async retransmitMessage(message: Message, retransmissionCount: number) {
        await this.messageStream.write(message);
        retransmissionCount++;
        if (retransmissionCount === this.config.retransmissionRetries) return;
        this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, retransmissionCount), this.config.activeRetransmissionTimeoutMs);
    }

    private closeExchange() {
        this.messagesQueue.close();
        this.closeCallback();
    }
}
