/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageCodec, SessionType } from "../../codec/MessageCodec";
import { Crypto } from "../../crypto/Crypto";
import { NetInterface, NetListener } from "../../net/NetInterface";
import { Session } from "../session/Session";
import { SessionManager } from "../session/SessionManager";
import { ExchangeSocket } from "./ExchangeSocket";
import { MessageExchange } from "./MessageExchange";
import { Protocol } from "./Protocol";

export class ExchangeManager<ContextT> {
    private readonly exchangeCounter = new ExchangeCounter();
    private readonly messageCounter = new MessageCounter();
    private readonly exchanges = new Map<number, MessageExchange<ContextT>>();
    private readonly protocols = new Map<number, Protocol<ContextT>>();
    private readonly netListeners = new Array<NetListener>();

    constructor(
        private readonly sessionManager: SessionManager<ContextT>,
    ) {}

    addNetInterface(netInterface: NetInterface) {
        this.netListeners.push(netInterface.onData((socket, data) => this.onMessage(socket, data)));
    }

    addProtocol(protocol: Protocol<ContextT>) {
        this.protocols.set(protocol.getId(), protocol);
    }

    initiateExchange(session: Session<ContextT>, channel: ExchangeSocket<Buffer>, protocolId: number) {
        const exchangeId = this.exchangeCounter.getIncrementedCounter();
        const exchange = MessageExchange.initiate(session, channel, exchangeId, protocolId, this.messageCounter, () => this.exchanges.delete(exchangeId & 0x10000));
        // Ensure exchangeIds are not colliding in the Map by adding 1 in front of exchanges initiated by this device.
        this.exchanges.set(exchangeId & 0x10000, exchange);
        return exchange;
    }

    close() {
        this.netListeners.forEach(netListener => netListener.close());
        this.netListeners.length = 0;
        [...this.exchanges.values()].forEach(exchange => exchange.close());
        this.exchanges.clear();
    }

    private onMessage(socket: ExchangeSocket<Buffer>, messageBytes: Buffer) {
        var packet = MessageCodec.decodePacket(messageBytes);
        if (packet.header.sessionType === SessionType.Group) throw new Error("Group messages are not supported");

        const session = this.sessionManager.getSession(packet.header.sessionId);
        if (session === undefined) throw new Error(`Cannot find a session for ID ${packet.header.sessionId}`);

        const message = session.decode(packet);
        const exchangeId = message.payloadHeader.isInitiatorMessage ? message.payloadHeader.exchangeId : message.payloadHeader.exchangeId & 0x10000;
        if (this.exchanges.has(exchangeId)) {
            const exchange = this.exchanges.get(exchangeId);
            exchange?.onMessageReceived(message);
        } else {
            const exchange = MessageExchange.fromInitialMessage(session, socket, this.messageCounter, message, () => this.exchanges.delete(exchangeId));
            this.exchanges.set(exchangeId, exchange);
            const protocolHandler = this.protocols.get(message.payloadHeader.protocolId);
            if (protocolHandler === undefined) throw new Error(`Unsupported protocol ${message.payloadHeader.protocolId}`);
            protocolHandler.onNewExchange(exchange, message);
        }
    }
}

export class ExchangeCounter {
    private exchangeCounter = Crypto.getRandomUInt16();

    getIncrementedCounter() {
        this.exchangeCounter++;
        if (this.exchangeCounter > 0xFFFF) {
            this.exchangeCounter = 0;
        }
        return this.exchangeCounter;
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
