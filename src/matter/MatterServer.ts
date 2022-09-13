/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../crypto/Crypto";
import { MessageCodec, SessionType } from "../codec/MessageCodec";
import { SessionManager } from "../session/SessionManager";
import { MessageExchange } from "./common/MessageExchange";
import { FabricManager } from "../fabric/FabricManager";
import { Session } from "../session/Session";
import { Fabric } from "../fabric/Fabric";
import { NetInterface } from "./common/NetInterface";
import { ExchangeSocket } from "./common/ExchangeSocket";
import { Protocol } from "./common/Protocol";
import { Broadcaster } from "./common/Broadcaster";

export class MatterServer {
    private readonly broadcasters = new Array<Broadcaster>();
    private readonly netInterfaces = new Array<NetInterface>();
    private readonly protocols = new Map<number, Protocol<MatterServer>>();
    private readonly exchangeCounter = new ExchangeCounter();
    private readonly messageCounter = new MessageCounter();
    private readonly exchanges = new Map<number, MessageExchange<MatterServer>>();
    private readonly fabricManager = new FabricManager();
    private readonly sessionManager = new SessionManager(this);

    constructor(
        private readonly deviceName: string,
        private readonly deviceType: number,
        private readonly vendorId: number,
        private readonly productId: number,
        private readonly discriminator: number,
    ) {}

    addBroadcaster(broadcaster: Broadcaster) {
        broadcaster.setCommissionMode(this.deviceName, this.deviceType, this.vendorId, this.productId, this.discriminator);
        this.broadcasters.push(broadcaster);
        return this;
    }

    addNetInterface(netInterface: NetInterface) {
        this.netInterfaces.push(netInterface);
        return this;
    }

    addProtocol(protocol: Protocol<MatterServer>) {
        this.protocols.set(protocol.getId(), protocol);
        return this;
    }

    start() {
        this.netInterfaces.forEach(netInterface => netInterface.onData((socket, data) => this.onMessage(socket, data)));
        this.broadcasters.forEach(broadcaster => broadcaster.announce());
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, false, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }

    findFabricFromDestinationId(destinationId: Buffer, peerRandom: Buffer) {
        return this.fabricManager.findFabricFromDestinationId(destinationId, peerRandom);
    }

    setFabric(fabric: Fabric) {
        this.fabricManager.addFabric(fabric);
        this.broadcasters.forEach(broadcaster => {
            broadcaster.setFabric(fabric);
            broadcaster.announce();
        });
    }

    initiateExchange(session: Session<MatterServer>, channel: ExchangeSocket<Buffer>, protocolId: number) {
        const exchangeId = this.exchangeCounter.getIncrementedCounter();
        const exchange = MessageExchange.initiate(session, channel, exchangeId, protocolId, this.messageCounter, () => this.exchanges.delete(exchangeId & 0x10000));
        // Ensure exchangeIds are not colliding in the Map by adding 1 in front of exchanges initiated by this device.
        this.exchanges.set(exchangeId & 0x10000, exchange);
        return exchange;
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

class ExchangeCounter {
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
