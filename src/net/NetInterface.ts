/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "./Channel";
import { util } from "@project-chip/matter.js";

export interface NetListener {
    close(): void;
}

export interface NetInterface {
    openChannel(address: string, port: number): Promise<Channel<util.ByteArray>>;
    onData(listener: (socket: Channel<util.ByteArray>, data: util.ByteArray) => void): NetListener;
}
