/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "./NetInterface";
import { util } from "@project-chip/matter.js";

export interface UdpChannelOptions {
    listeningPort: number,
    listeningAddress?: string,
    multicastInterface?: string,
}

export interface UdpChannel {
    onData(listener: (peerAddress: string, peerPort: number, data: util.ByteArray) => void): NetListener;
    send(address: string, port: number, data: util.ByteArray): Promise<void>;
    close(): void;
}
