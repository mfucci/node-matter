/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "./NetInterface";
import { ByteArray } from "@project-chip/matter.js";

export interface UdpChannelOptions {
    listeningPort: number,
    listeningAddress?: string,
    multicastInterface?: string,
}

export interface UdpChannel {
    onData(listener: (peerAddress: string, peerPort: number, data: ByteArray) => void): NetListener;
    send(address: string, port: number, data: ByteArray): Promise<void>;
    close(): void;
}
