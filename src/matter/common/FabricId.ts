/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tlv, spec } from "@project-chip/matter.js";

/**
 * A Fabric ID is a 64-bit number that uniquely identifies the Fabric within the scope of
 * a particular root CA.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 2.5.1
 */
 export class FabricId {
    constructor(
        readonly id: bigint,
    ) {}
}

/** Tlv schema for a Node Identifier. */
export const TlvFabricId = new tlv.Wrapper<FabricId, number | bigint>(
    tlv.UInt64,
    fabricId => fabricId.id,
    value => new FabricId(BigInt(value)),
);
