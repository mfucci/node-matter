/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResumptionRecord, SessionManager } from "./session/SessionManager";
import { FabricManager } from "./fabric/FabricManager";
import { Session } from "./session/Session";
import { Fabric } from "./fabric/Fabric";
import { NetInterface } from "../net/NetInterface";
import { Channel } from "../net/Channel";
import { ProtocolHandler } from "./common/ProtocolHandler";
import { Broadcaster } from "./common/Broadcaster";
import { ExchangeManager } from "./common/ExchangeManager";
import { requireMinNodeVersion } from "../util/Node";

requireMinNodeVersion(16);

export class MatterDevice {
    private readonly broadcasters = new Array<Broadcaster>();
    private readonly fabricManager = new FabricManager();
    private readonly sessionManager = new SessionManager(this);
    private readonly exchangeManager = new ExchangeManager<MatterDevice>(this.sessionManager);

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

    addProtocolHandler(protocol: ProtocolHandler<MatterDevice>) {
        this.exchangeManager.addProtocolHandler(protocol);
        return this;
    }

    start() {
        this.broadcasters.forEach(broadcaster => broadcaster.announce());
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, isResumption: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, isResumption, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }

    findFabricFromDestinationId(destinationId: Buffer, peerRandom: Buffer) {
        return this.fabricManager.findFabricFromDestinationId(destinationId, peerRandom);
    }

    setFabric(fabric: Fabric) {
        this.fabricManager.addFabric(fabric);
        this.broadcasters.forEach(broadcaster => {
            broadcaster.setFabric(fabric.operationalId, fabric.nodeId);
            broadcaster.announce();
        });
    }

    initiateExchange(session: Session<MatterDevice>, channel: Channel<Buffer>, protocolId: number) {
        return this.exchangeManager.initiateExchange(session, channel, protocolId);
    }

    findResumptionRecordById(resumptionId: Buffer) {
        return this.sessionManager.findResumptionRecordById(resumptionId);
    }

    saveResumptionRecord(resumptionRecord: ResumptionRecord) {
        return this.sessionManager.saveResumptionRecord(resumptionRecord);
    }

    armFailSafe() {
        return this.fabricManager.armFailSafe();
    }

    getFabricBuilder() {
        return this.fabricManager.getFabricBuilder();
    }

    completeCommission() {
        return this.fabricManager.completeCommission();
    }

    stop() {
        this.exchangeManager.close();
        this.broadcasters.forEach(broadcaster => broadcaster.close());
    }
}
