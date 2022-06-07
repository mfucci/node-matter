/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../crypto/Crypto";
import { Message, MessageCodec, SessionType } from "../codec/MessageCodec";
import { Queue } from "../util/Queue";
import { getSessionManager, Session } from "../session/SessionManager";

export const enum Protocol {
    SECURE_CHANNEL = 0x0000,
    INTERACTION_MODEL = 0x0001,
}

export interface ExchangeSocket<T> {
    send(data: T): Promise<void>;
    getName():string;
}

export interface Channel {
    bind(listener: (socket: ExchangeSocket<Buffer>, messageBytes: Buffer) => void): void;
}

export interface ProtocolHandler {
    onNewExchange(exchange: MessageExchange): void;
}

export class MatterServer {
    private readonly channels = new Array<Channel>();
    private readonly protocolHandlers = new Map<Protocol, ProtocolHandler>();

    private readonly messageCounter = new MessageCounter();
    private readonly exchanges = new Map<number, MessageExchange>();
    private readonly sessionManager = getSessionManager();

    addChannel(channel: Channel) {
        this.channels.push(channel);
        return this;
    }

    addProtocolHandler(protocol: Protocol, protocolHandler: ProtocolHandler) {
        this.protocolHandlers.set(protocol, protocolHandler);
        return this;
    }

    start() {
        this.channels.forEach(channel => channel.bind((socket, data) => this.onMessage(socket, data)));
    }

    private onMessage(socket: ExchangeSocket<Buffer>, messageBytes: Buffer) {
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
            const exchange = MessageExchange.fromInitialMessage(session, socket, this.messageCounter, message);
            this.exchanges.set(exchangeId, exchange);
            const protocolHandler = this.protocolHandlers.get(message.payloadHeader.protocolId);
            if (protocolHandler === undefined) throw new Error(`Unsupported protocol ${message.payloadHeader.protocolId}`);
            protocolHandler.onNewExchange(exchange);
        }
    }
}

export class MessageChannel implements ExchangeSocket<Message> {
    constructor(
        private readonly channel: ExchangeSocket<Buffer>,
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
    private readonly channel: MessageChannel;
    private ackedMessageId: number | undefined;
    private messagesQueue = new Queue<Message>();

    constructor(
        private readonly session: Session,
        channel: ExchangeSocket<Buffer>,
        private readonly messageCounter: MessageCounter,
        private readonly initialMessage: Message,
    ) {
        this.channel = new MessageChannel(channel, session);
        this.ackedMessageId = initialMessage.payloadHeader.requiresAck ? initialMessage.packetHeader.messageId : undefined;
        this.messagesQueue.write(initialMessage);
    }

    static fromInitialMessage(
            session: Session,
            channel: ExchangeSocket<Buffer>,
            messageCounter: MessageCounter,
            initialMessage: Message) {
        return new MessageExchange(
            session,
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

    getSession() {
        return this.session;
    }

    getInitialMessageType() {
        return this.initialMessage.payloadHeader.messageType;
    }

    getChannel() {
        return this.channel;
    }

    async waitFor(messageType: number) {
        const message = await this.messagesQueue.read();
        const { payloadHeader: { messageType: receivedMessageType }} = message;
        if (receivedMessageType !== messageType) throw new Error(`Received unexpected message type ${receivedMessageType.toString(16)}. Expected ${messageType.toString(16)}`);
        return message;
    }
}
