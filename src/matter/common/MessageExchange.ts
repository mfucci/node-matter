/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, MessageCodec, SessionType } from "../../codec/MessageCodec";
import { Queue } from "../../util/Queue";
import { Session } from "../session/Session";
import { MessageType } from "../session/secure/SecureChannelMessages";
import { MessageChannel, MessageCounter } from "./ExchangeManager";

export class MessageExchange<ContextT> {
    private readonly activeRetransmissionTimeoutMs: number;
    private readonly retransmissionRetries: number;
    private readonly messagesQueue = new Queue<Message>();
    private receivedMessageToAck: Message | undefined;
    private sentMessageToAck: Message | undefined;
    private retransmissionTimeoutId:  NodeJS.Timeout | undefined;

    static fromInitialMessage<ContextT>(
        channel: MessageChannel<ContextT>,
        messageCounter: MessageCounter,
        initialMessage: Message,
        closeCallback: () => void,
    ) {
        const {session} = channel;
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
        channel: MessageChannel<ContextT>,
        exchangeId: number,
        protocolId: number,
        messageCounter: MessageCounter,
        closeCallback: () => void,
    ) {
        const {session} = channel;
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

    constructor(
        readonly session: Session<ContextT>,
        readonly channel: MessageChannel<ContextT>,
        private readonly messageCounter: MessageCounter,
        private readonly isInitiator: boolean,
        private readonly peerSessionId: number,
        private readonly nodeId: bigint | undefined,
        private readonly peerNodeId: bigint | undefined,
        private readonly exchangeId: number,
        private readonly protocolId: number,
        private readonly closeCallback: () => void,
    ) {
        const {activeRetransmissionTimeoutMs: activeRetransmissionTimeoutMs, retransmissionRetries} = session.getMrpParameters();
        this.activeRetransmissionTimeoutMs = activeRetransmissionTimeoutMs;
        this.retransmissionRetries = retransmissionRetries;
    }

    onMessageReceived(message: Message) {
        const { packetHeader: { messageId }, payloadHeader: { requiresAck, ackedMessageId, messageType } } = message;

        console.log("onMessageReceived", MessageCodec.messageToString(message));

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
            if (requiresAck) throw new Error("Standalone acks should not require an ack");
            // Wait some time before closing this exchange to handle potential retransmissions
            setTimeout(() => this.closeInternal(), this.activeRetransmissionTimeoutMs * 3);
            return;
        }
        if (requiresAck) {
            this.receivedMessageToAck = message;
        }
        this.messagesQueue.write(message);
    }

    send(messageType: number, payload: Buffer) {
        if (this.sentMessageToAck !== undefined) throw new Error("The previous message has not been acked yet, cannot send a new message");
        const message = {
            packetHeader: {
                sessionId: this.peerSessionId,
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
        this.sentMessageToAck = message;
        if (message.payloadHeader.requiresAck) {
            this.retransmissionTimeoutId = setTimeout(() => this.retransmitMessage(message, 0), this.activeRetransmissionTimeoutMs);
        }

        return this.channel.send(message);
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
        setTimeout(() => this.closeInternal(), this.activeRetransmissionTimeoutMs * 3);
    }

    private closeInternal() {
        clearTimeout(this.retransmissionTimeoutId);
        this.messagesQueue.close();
        this.closeCallback();
    }
}
