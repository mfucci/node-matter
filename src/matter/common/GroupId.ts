/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

 import { tlv, spec } from "@project-chip/matter.js";

/**
 * A Group Identifier (Group ID or GID) is a 16-bit number that identifies a set of Nodes across a
 * Fabric at the message layer (see Section 4.15, “Group Key Management”). A Group ID can further
 * be bound to one or more Endpoints within each Node in the group at the interaction layer.
 *
 * The Group ID space is allocated as described in Table 2, “Group ID Allocations”:
 * 0x0000 - Null or unspecified Group ID
 * 0x0001 - 0xFEFF: Application Group ID, assigned by fabric Administrator
 * 0xFF00 - 0xFFFF: Universal Group ID range reserved for static multicast and anycast identifiers
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 2.5.4
 */
export class GroupId {
    constructor(
        readonly id: number,
    ) {}
}

/** Tlv Schema for a Group Id. */
export const TlvGroupId = new tlv.Wrapper<GroupId, number>(
    tlv.UInt16,
    groupId => groupId.id,
    value => new GroupId(value),
);
