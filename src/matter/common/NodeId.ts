/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A Node Identifier (Node ID) is a 64-bit number that uniquely identifies an individual Node or a
 * group of Nodes on a Fabric.
 * 
 * @see [Matter Specification R1.0], section 2.5.5
 */
export type NodeId = { nodeId: true /* Hack to force strong type checking at compile time */ };
export const NodeId = (id: bigint) => id as unknown as NodeId;

/** Explicitly convert a NodeId to a bigint */
export const nodeIdToBigint = (nodeId: NodeId) => nodeId as unknown as bigint;
