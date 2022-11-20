/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tlv, spec } from "@project-chip/matter.js";

/**
 * An Attribute ID is a 32 bit number and indicates an attribute defined in a cluster specification.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 7.18.2.15
 */
export class AttributeId {
    constructor(
        readonly id: number
    ) {}
}

/** Tlv schema for an Attribute Id. */
export const TlvAttributeId = new tlv.Wrapper<AttributeId, number>(
    tlv.UInt32,
    attributeId => attributeId.id,
    value => new AttributeId(value),
);
