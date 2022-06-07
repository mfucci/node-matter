/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, Packet } from "../codec/MessageCodec";
import { Crypto } from "../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { Singleton } from "../util/Singleton";
import { SecureSession } from "./SecureSession";
import { UnsecureSession } from "./UnsecureSession";

export const UNDEFINED_NODE_ID = BigInt(0);

export const UNICAST_UNSECURE_SESSION_ID = 0x0000;

export const getSessionManager = Singleton(() => new SessionManager());

export class SessionManager {
    private readonly sessions = new Map<number, Session>();
    private nextSessionId = Crypto.getRandomUInt16();

    constructor() {
        this.sessions.set(UNICAST_UNSECURE_SESSION_ID, new UnsecureSession());
    }

    async createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean) {
        const session = await SecureSession.create(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator);
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
}

export interface Session {
    getName(): string;
    decode(packet: Packet): Message,
    encode(message: Message): Packet,
    getAttestationChallengeKey(): Buffer,
    setFabric(fabric: Fabric): void;
}
