/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../crypto/Crypto";
import { MessageCodec, SessionType } from "../codec/MessageCodec";
import { getSessionManager } from "../session/SessionManager";
import { MessageExchange } from "./MessageExchange";

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
            const exchange = MessageExchange.fromInitialMessage(session, socket, this.messageCounter, message, () => this.exchanges.delete(exchangeId));
            this.exchanges.set(exchangeId, exchange);
            const protocolHandler = this.protocolHandlers.get(message.payloadHeader.protocolId);
            if (protocolHandler === undefined) throw new Error(`Unsupported protocol ${message.payloadHeader.protocolId}`);
            protocolHandler.onNewExchange(exchange);
        }
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
