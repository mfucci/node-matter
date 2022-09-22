/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export type MatterDevice = {
    ip: string,
    port: number,
};

export interface Scanner {
    lookForDevice(operationalId: Buffer, nodeId: bigint): Promise<MatterDevice | undefined>;
    close(): void;
}
