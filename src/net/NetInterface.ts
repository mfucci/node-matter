/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExchangeSocket } from "../matter/common/ExchangeSocket";

export interface NetListener {
    close(): void;
}

export interface NetInterface {
    openChannel(address: string, port: number): Promise<ExchangeSocket<Buffer>>;
    onData(listener: (socket: ExchangeSocket<Buffer>, data: Buffer) => void): NetListener;
}
