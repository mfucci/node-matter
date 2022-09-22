/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Broadcaster {
    setCommissionMode(deviceName: string, deviceType: number, vendorId: number, productId: number, discriminator: number): void;
    setFabric(operationalId: Buffer, nodeId: bigint): void;
    announce(): Promise<void>;
    close(): void;
}
