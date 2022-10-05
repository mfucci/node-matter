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
import { Scanner } from "./common/Scanner";

requireMinNodeVersion(16);

export class MatterDevice {
    private readonly scanners = new Array<Scanner>();
    private readonly broadcasters = new Array<Broadcaster>();
    private readonly netInterfaces = new Array<NetInterface>();
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

    addScanner(scanner: Scanner) {
        this.scanners.push(scanner);
        return this;
    }

    addBroadcaster(broadcaster: Broadcaster) {
        broadcaster.setCommissionMode(this.deviceName, this.deviceType, this.vendorId, this.productId, this.discriminator);
        this.broadcasters.push(broadcaster);
        return this;
    }

    addNetInterface(netInterface: NetInterface) {
        this.exchangeManager.addNetInterface(netInterface);
        this.netInterfaces.push(netInterface);
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

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, idleRetransTimeoutMs, activeRetransTimeoutMs);
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

    async findDevice(fabric: Fabric, nodeId: bigint): Promise<undefined | {session: Session<MatterDevice>, channel: Channel<Buffer>}> {
        // TODO: return the first not undefined answer or undefined
        console.log("find", nodeId);
        const matterServer = await this.scanners[0].findDevice(fabric, nodeId);
        console.log("server", matterServer);
        if (matterServer === undefined) return undefined;
        const { ip, port } = matterServer;
        const session = this.sessionManager.getSessionForNode(fabric, nodeId);
        console.log("session", session);
        if (session === undefined) return undefined;
        // TODO: have the interface and scanner linked
        return { session, channel: await this.netInterfaces[0].openChannel(ip, port)};
    }

    stop() {
        this.exchangeManager.close();
        this.broadcasters.forEach(broadcaster => broadcaster.close());
    }
}
