/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * An Attribute ID is a 32 bit number and indicates an attribute defined in a cluster specification.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 7.18.2.15
 */
export type AttributeId = { attributeId: true /* Hack to force strong type checking at compile time */ };
export const AttributeId = (id: number) => id as unknown as AttributeId;

/** Data model for a Attribute ID. */
export const AttributeIdT = Typed<AttributeId>(UnsignedIntT);
