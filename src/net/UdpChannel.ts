/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "./NetInterface";
import { ByteArray } from "@project-chip/matter.js";

export interface UdpChannelOptions {
    listeningPort: number,
    type: "udp4" | "udp6",
    listeningAddress?: string,
    netInterface?: string,
}

export interface UdpChannel {
    onData(listener: (netInterface: string, peerAddress: string, peerPort: number, data: ByteArray) => void): NetListener;
    send(address: string, port: number, data: ByteArray): Promise<void>;
    close(): void;
}
