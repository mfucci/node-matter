/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UInt64T } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * A Fabric ID is a 64-bit number that uniquely identifies the Fabric within the scope of
 * a particular root CA.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 2.5.1
 */
export type FabricId = { fabricId: true /* Hack to force strong type checking at compile time */ };
export const FabricId = (id: bigint) => id as unknown as FabricId;

/** Explicitly convert a FabricID to a bigint */
export const fabricIdToBigint = (fabricId: FabricId) => fabricId as unknown as bigint;

/** Data model for a Fabric ID. */
export const FabricIdT = Typed<FabricId>(UInt64T);
