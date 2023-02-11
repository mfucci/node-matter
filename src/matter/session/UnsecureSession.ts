/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Packet, Message, MessageCodec } from "../../codec/MessageCodec";
import { Fabric } from "../fabric/Fabric";
import { DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_RETRANSMISSION_RETRIES, Session } from "./Session";
import { UNICAST_UNSECURE_SESSION_ID } from "./SessionManager";
import { ByteArray } from "@project-chip/matter.js";
import { NodeId } from "../common/NodeId";

export class UnsecureSession<T> implements Session<T> {
    private readonly initiatorNodeId = NodeId.getRandomOperationalNodeId();

    constructor(
        private readonly context: T,
    ) {}

    isSecure(): boolean {
        return false;
    }

    touchSessionTimestamps(messageSent: boolean) {
        // Do nothing
    }

    isPeerActive(): boolean {
        return true;
    }

    decode(packet: Packet): Message {
        return MessageCodec.decodePayload(packet);
    }

    encode(message: Message): Packet {
        return MessageCodec.encodePayload(message);
    }

    getAttestationChallengeKey(): ByteArray {
        throw new Error("Not supported on an unsecure session");
    }

    setFabric(fabric: Fabric): void {
        throw new Error("Not supported on an unsecure session");
    }

    getName() {
        return "unsecure";
    }

    getMrpParameters() {
        return {
            idleRetransmissionTimeoutMs: DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS,
            activeRetransmissionTimeoutMs: DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS,
            retransmissionRetries: DEFAULT_RETRANSMISSION_RETRIES,
        }
    }

    getContext() {
        return this.context;
    }

    getId(): number {
        return UNICAST_UNSECURE_SESSION_ID;
    }

    getPeerSessionId(): number {
        return UNICAST_UNSECURE_SESSION_ID;
    }

    getNodeId() {
        return this.initiatorNodeId;
    }

    getPeerNodeId() {
        return undefined;
    }
}
