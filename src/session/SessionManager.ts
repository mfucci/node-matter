/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { SecureSession } from "./SecureSession";
import { Session } from "./Session";
import { UnsecureSession } from "./UnsecureSession";

export const UNDEFINED_NODE_ID = BigInt(0);

export const UNICAST_UNSECURE_SESSION_ID = 0x0000;

export interface ResumptionRecord {
    sharedSecret: Buffer,
    resumptionId: Buffer,
    fabric: Fabric,
    peerNodeId: bigint,
}

export class SessionManager<ContextT> {
    private readonly unsecureSession: UnsecureSession<ContextT>;
    private readonly sessions = new Map<number, Session<ContextT>>();
    private nextSessionId = Crypto.getRandomUInt16();
    private resumptionRecords = new Map<bigint, ResumptionRecord>();

    constructor(
        private readonly context: ContextT,
    ) {
        this.unsecureSession = new UnsecureSession(context);
        this.sessions.set(UNICAST_UNSECURE_SESSION_ID, this.unsecureSession);
    }

    async createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        const session = await SecureSession.create(this.context, sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, idleRetransTimeoutMs, activeRetransTimeoutMs);
        this.sessions.set(sessionId, session);
        return session;
    }

    getNextAvailableSessionId() {
        while (true) {
            if (this.sessions.has(this.nextSessionId)) {
                this.nextSessionId = (this.nextSessionId + 1) & 0xFFFF;
                if (this.nextSessionId === 0) this.nextSessionId++;
                continue;
            }
            return this.nextSessionId++;
        }
    }

    getSession(sessionId: number) {
        return this.sessions.get(sessionId);
    }

    getUnsecureSession() {
        return this.unsecureSession;
    }

    findResumptionRecordById(resumptionId: Buffer) {
        return [...this.resumptionRecords.values()].find(record => record.resumptionId.equals(resumptionId));
    }

    findResumptionRecordByNodeId(nodeId: bigint) {
        return this.resumptionRecords.get(nodeId);
    }

    saveResumptionRecord(resumptionRecord: ResumptionRecord) {
        this.resumptionRecords.set(resumptionRecord.peerNodeId, resumptionRecord);
    }
}
