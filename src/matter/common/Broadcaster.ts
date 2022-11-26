/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeId } from "./NodeId";
import { VendorId } from "./VendorId";
import { util } from "@project-chip/matter.js";

export interface Broadcaster {
    setCommissionMode(deviceName: string, deviceType: number, vendorId: VendorId, productId: number, discriminator: number): void;
    setFabric(operationalId: util.ByteArray, nodeId: NodeId): void;
    announce(): Promise<void>;
    close(): void;
}
