/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bound, Typed, UInt8T } from "../../codec/DataModels";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * Each fabric supported on a node is referenced by fabric-index that is unique on the node. This
 * fab­ric-index enables the look-up of the full fabric information from the fabric-index. A fabric-index
 * of 0 (zero) or null SHALL indicate that there is no fabric associated with the context in which the
 * fab­ric-index is being used. If fabric-index is used in a context that is exclusively associated with
 * a fab­ric, such as fabric-scoped data model elements, then the fabric-index values SHALL NOT include 0
 * (zero) or null.
 * 
 * @see {@link MatterCoreSpecificationV1_0} § 7.5.2
 */
export type FabricIndex = { fabricIndex: true /* Hack to force strong type checking at compile time */ };
export const FabricIndex = (id: number) => id as unknown as FabricIndex;

/** Data model for a fabric-index associated with a fabric. */
export const FabricIndexT = Typed<FabricIndex>(Bound(UInt8T, { min: 1, max: 254 }));
