/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "./NetInterface";

export interface UdpChannelOptions {
    listeningPort: number,
    listeningAddress?: string,
    multicastInterface?: string,
}

export interface UdpChannel {
    onData(listener: (peerAddress: string, peerPort: number, data: Buffer) => void): NetListener;
    send(address: string, port: number, data: Buffer): Promise<void>;
    close(): void;
}
