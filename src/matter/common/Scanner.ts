/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export type MatterServer = {
    ip: string,
    port: number,
};

export interface Scanner {
    lookForDevice(operationalId: Buffer, nodeId: bigint): Promise<MatterServer | undefined>;
    close(): void;
}
