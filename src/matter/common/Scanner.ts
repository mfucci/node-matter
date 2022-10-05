/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Fabric } from "../fabric/Fabric";

export type MatterServer = {
    ip: string,
    port: number,
};

export interface Scanner {
    findDevice(fabric: Fabric, nodeId: bigint): Promise<MatterServer | undefined>;
    close(): void;
}
