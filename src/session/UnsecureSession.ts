/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Packet, Message, MessageCodec } from "../codec/MessageCodec";
import { Fabric } from "../fabric/Fabric";
import { DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_RETRANSMISSION_RETRIES, Session } from "./Session";

export class UnsecureSession implements Session {
    decode(packet: Packet): Message {
        return MessageCodec.decodePayload(packet);
    }

    encode(message: Message): Packet {
        return MessageCodec.encodePayload(message);
    }

    getAttestationChallengeKey(): Buffer {
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
}
