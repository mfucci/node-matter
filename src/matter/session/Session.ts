/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, Packet } from "../../codec/MessageCodec";
import { Fabric } from "../fabric/Fabric";

export const DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS = 5000;
export const DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS = 300;
export const DEFAULT_RETRANSMISSION_RETRIES = 2;

interface MrpParameters {
    idleRetransmissionTimeoutMs: number,
    activeRetransmissionTimeoutMs: number,
    retransmissionRetries: number,
}

export interface Session<T> {
    isSecure(): boolean;
    getName(): string;
    decode(packet: Packet): Message;
    encode(message: Message): Packet;
    getAttestationChallengeKey(): Buffer;
    setFabric(fabric: Fabric): void;
    getMrpParameters(): MrpParameters;
    getContext(): T;
    getId(): number;
    getPeerSessionId(): number;
    getNodeId(): bigint | undefined;
    getPeerNodeId(): bigint | undefined;
}
