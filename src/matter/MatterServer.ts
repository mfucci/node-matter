/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionManager } from "../session/SessionManager";
import { FabricManager } from "../fabric/FabricManager";
import { Session } from "../session/Session";
import { Fabric } from "../fabric/Fabric";
import { NetInterface } from "../net/NetInterface";
import { ExchangeSocket } from "./common/ExchangeSocket";
import { Protocol } from "./common/Protocol";
import { Broadcaster } from "./common/Broadcaster";
import { ExchangeManager } from "./common/ExchangeManager";

export class MatterServer {
    private readonly broadcasters = new Array<Broadcaster>();
    private readonly fabricManager = new FabricManager();
    private readonly sessionManager = new SessionManager(this);
    private readonly exchangeManager = new ExchangeManager<MatterServer>(this.sessionManager);

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
        this.exchangeManager.addNetInterface(netInterface);
        return this;
    }

    addProtocol(protocol: Protocol<MatterServer>) {
        this.exchangeManager.addProtocol(protocol);
        return this;
    }

    start() {
        this.broadcasters.forEach(broadcaster => broadcaster.announce());
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, idleRetransTimeoutMs, activeRetransTimeoutMs);
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
        return this.exchangeManager.initiateExchange(session, channel, protocolId);
    }
}
