/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tlv, spec } from "@project-chip/matter.js";

/**
 * A Node Identifier (Node ID) is a 64-bit number that uniquely identifies an individual Node or a
 * group of Nodes on a Fabric.
 * 
 * @see {@link spec.MatterCoreSpecificationV1_0} § 2.5.5
 */
export class NodeId {
    constructor(
        readonly id: bigint,
    ) {}
}

/** Tlv schema for a Node Identifier. */
export const TlvNodeId = new tlv.Wrapper<NodeId, number | bigint>(
    tlv.UInt64,
    nodeId => nodeId.id,
    value => new NodeId(BigInt(value)),
);
