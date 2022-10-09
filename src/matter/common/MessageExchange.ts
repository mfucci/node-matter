/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, MessageCodec, SessionType } from "../../codec/MessageCodec";
import { Queue } from "../../util/Queue";
import { Session } from "../session/Session";
import { Channel } from "../../net/Channel";
import { MessageType } from "../session/secure/SecureChannelMessages";
import { MessageCounter } from "./ExchangeManager";
import { getPromiseResolver } from "../../util/Promises";

class MessageChannel<ContextT> implements Channel<Message> {
    constructor(
        readonly channel: Channel<Buffer>,
        private readonly session: Session<ContextT>,
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

export class MessageExchange<ContextT> {
    static fromInitialMessage<ContextT>(
        session: Session<ContextT>,
        channel: Channel<Buffer>,
        messageCounter: MessageCounter,
        initialMessage: Message,
        closeCallback: () => void,
    ) {
        const exchange = new MessageExchange<ContextT>(
            session,
            channel,
            messageCounter,
            false,
            session.getId(),
            initialMessage.packetHeader.destNodeId,
            initialMessage.packetHeader.sourceNodeId,
            initialMessage.payloadHeader.exchangeId,
            initialMessage.payloadHeader.protocolId,
            closeCallback,
        )
        exchange.onMessageReceived(initialMessage);
        return exchange;
    }

    static initiate<ContextT>(
        session: Session<ContextT>,
        channel: Channel<Buffer>,
        exchangeId: number,
        protocolId: number,
        messageCounter: MessageCounter,
        closeCallback: () => void,
    ) {
        return new MessageExchange(
            session,
            channel,
            messageCounter,
            true,
            session.getPeerSessionId(),
            session.getNodeId(),
            session.getPeerNodeId(),
            exchangeId,
            protocolId,
            closeCallback,
        );
    }

    readonly channel: MessageChannel<ContextT>;
    private readonly activeRetransmissionTimeoutMs: number;
    private readonly retransmissionRetries: number;
    private readonly messagesQueue = new Queue<Message>();
    private receivedMessageToAck: Message | undefined;
    private sentMessageToAck: Message | undefined;
    private sentMessageAckSuccess: (() => void) | undefined;
    private sentMessageAckFailure: (() => void) | undefined;
    private retransmissionTimeoutId:  NodeJS.Timeout | undefined;

    constructor(
        readonly session: Session<ContextT>,
        channel: Channel<Buffer>,
        private readonly messageCounter: MessageCounter,
        private readonly isInitiator: boolean,
        private readonly sessionId: number,
        private readonly nodeId: bigint | undefined,
        private readonly peerNodeId: bigint | undefined,
        private readonly exchangeId: number,
        private readonly protocolId: number,
        private readonly closeCallback: () => void,
    ) {
        this.channel = new MessageChannel(channel, session);
        const {activeRetransmissionTimeoutMs, idleRetransmissionTimeoutMs, retransmissionRetries} = session.getMrpParameters();
        this.activeRetransmissionTimeoutMs = activeRetransmissionTimeoutMs;
        this.retransmissionRetries = retransmissionRetries;
    }

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
            this.channel.send(this.sentMessageToAck);
            return;
        }
        if (this.sentMessageToAck !== undefined) {
            if (ackedMessageId === undefined) throw new Error("Previous message ack is missing");
            if (ackedMessageId !== this.sentMessageToAck.packetHeader.messageId) throw new Error("Incorrect ack received");
            // The other side has received our previous message
            this.sentMessageAckSuccess?.();
            this.sentMessageToAck = undefined;
            clearTimeout(this.retransmissionTimeoutId);
        }
        if (messageType === MessageType.StandaloneAck) {
            // Don't include standalone acks in the message stream
            return;
        }
        if (requiresAck) {
            this.receivedMessageToAck = message;
        }
        this.messagesQueue.write(message);
    }

    async send(messageType: number, payload: Buffer) {
        if (this.sentMessageToAck !== undefined) throw new Error("The previous message has not been acked yet, cannot send a new message");
        const message = {
            packetHeader: {
                sessionId: this.sessionId,
                sessionType: SessionType.Unicast, // TODO: support multicast
                messageId: this.messageCounter.getIncrementedCounter(),
                destNodeId: this.peerNodeId,
                sourceNodeId: this.nodeId,
            },
            payloadHeader: {
                exchangeId: this.exchangeId,
                protocolId: this.protocolId,
                messageType,
                isInitiatorMessage: this.isInitiator,
                requiresAck: messageType === MessageType.StandaloneAck ? false : true,
                ackedMessageId: this.receivedMessageToAck?.packetHeader.messageId,
            },
            payload,
        };
        this.receivedMessageToAck = undefined;
        let ackPromise: Promise<void> | undefined;
        if (message.payloadHeader.requiresAck) {
            this.sentMessageToAck = message;
            this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, 0), this.activeRetransmissionTimeoutMs);
            const { promise, resolver, rejecter } = await getPromiseResolver<void>();
            this.sentMessageAckSuccess = resolver;
            this.sentMessageAckFailure = rejecter;
        }

        await this.channel.send(message);

        if (ackPromise !== undefined) {
            await ackPromise;
            this.sentMessageAckFailure = undefined;
            this.sentMessageAckFailure = undefined;
        }
    }

    nextMessage() {
        return this.messagesQueue.read();
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

    close() {
        if (this.receivedMessageToAck !== undefined) {
            this.send(MessageType.StandaloneAck, Buffer.alloc(0));
        }
        setTimeout(() => this.closeInternal(), this.activeRetransmissionTimeoutMs * (this.retransmissionRetries + 1));
    }

    private closeInternal() {
        clearTimeout(this.retransmissionTimeoutId);
        this.sentMessageAckFailure?.();
        this.messagesQueue.close();
        this.closeCallback();
    }
}
