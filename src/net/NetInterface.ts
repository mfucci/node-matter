/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "./Channel";

export interface NetListener {
    close(): void;
}

export interface NetInterface {
    openChannel(address: string, port: number): Promise<Channel<Buffer>>;
    onData(listener: (socket: Channel<Buffer>, data: Buffer) => void): NetListener;
}
