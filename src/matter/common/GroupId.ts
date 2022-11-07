/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UInt16T, Typed } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";
import { NodeId } from "./NodeId";

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
 * @see {@link MatterCoreSpecificationV1_0} § 2.5.4
 */
export type GroupId = { groupId: true /* Hack to force strong type checking at compile time */ };
export const GroupId = (id: number) => id as unknown as GroupId;

/** Explicitly converts a GroupId to a number. */
export const groupIdToNumber = (groupId: GroupId) => groupId as unknown as number;

/** Data model for a Group ID. */
export const GroupIdT = Typed<GroupId>(UInt16T);
