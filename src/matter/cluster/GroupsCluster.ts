/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { StatusCode } from "../interaction/InteractionMessages";
import { TlvGroupId } from "../common/GroupId";
import { tlv, spec, schema } from "@project-chip/matter.js";

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.1 */
const TlvAddGroupRequest = tlv.Object({
    groupId: tlv.Field(0, TlvGroupId), /* min: 1 */
    groupName: tlv.Field(1, tlv.String.bound({ maxLength: 16 })),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.7 */
const TlvAddGroupResponse = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
    groupId: tlv.Field(1, TlvGroupId), /* type: min: 1 */
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.2 */
const TlvViewGroupRequest = tlv.Object({
    groupId: tlv.Field(0, TlvGroupId), /* type: min: 1 */
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.8 */
const TlvViewGroupResponse = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
    groupId: tlv.Field(1, TlvGroupId), /* min: 1 */
    groupName: tlv.Field(2, tlv.String.bound( { maxLength: 16 })),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.3 */
const TlvGetGroupMembershipRequest = tlv.Object({
    groupList: tlv.Field(0, tlv.Array(TlvGroupId)), /* groupId min: 1 */
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.9 */
const TlvGetGroupMembershipResponse = tlv.Object({
    /** contain the remaining capacity of the Group Table of the node. */
    capacity: tlv.Field(0, tlv.Nullable(tlv.UInt8)),
    groupList: tlv.Field(1, tlv.Array(TlvGroupId)), /* groupId min: 1 */
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.4 */
const TlvRemoveGroupRequest = tlv.Object({
    groupId: tlv.Field(0, TlvGroupId), /* min: 1 */
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.10 */
const TlvRemoveGroupResponse = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
    groupId: tlv.Field(1, TlvGroupId), /* min: 1 */
});

/**
 * Formally not defined in specs state:
 * If the RemoveAllGroups command was received as unicast and a response is not
 * suppressed, the server SHALL generate a response with the Status field set to SUCCESS.
 *
 * @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.5.1
 */
const TlvRemoveAllGroupResponse = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7.6 */
const TlvAddGroupIfIdentifyingRequest = tlv.Object({
    groupId: tlv.Field(0, TlvGroupId), /* min: 1 */
    groupName: tlv.Field(1, tlv.String.bound( { maxLength: 16 })),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.6.1 */
const TlvNameSupportBitmap = tlv.Bitmap(tlv.UInt8, {
    groupNames: schema.BitFlag(7),
});

/**
 * The Groups cluster manages, per endpoint, the content of the node-wide Group
 * Table that is part of the underlying interaction layer.
 *
 * @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3
 */
export const GroupsCluster = Cluster({
    id: 0x04,
    name: "Groups",
    revision: 4,
    features: {
        /** The ability to store a name for a group. */
        groupNames: schema.BitFlag(0),
    },

    /** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.6 */
    attributes: {
        /**
         * This attribute provides legacy, read-only access to whether the Group
         * Names feature is supported. The most significant bit, bit 7, SHALL be
         * equal to bit 0 of the FeatureMap attribute. All other bits SHALL be 0.
         *
         * TODO because we (will) support group names we need to set bit 7 to 1, rest is 0
         */
        nameSupport: Attribute(0, TlvNameSupportBitmap, { default: { groupNames: true } }),
    },

    /** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.3.7 */
    commands: {
        /**
         * The AddGroup command allows a client to add group membership in a particular group for the server endpoint.
         */
        addGroup: Command(0, TlvAddGroupRequest, 0, TlvAddGroupResponse),

        /**
         * The ViewGroup command allows a client to request that the server responds with a ViewGroupResponse command
         * containing the name string for a particular group.
         * 
         */
        viewGroup: Command(1, TlvViewGroupRequest, 0, TlvViewGroupResponse),

        /**
         * The GetGroupMembership command allows a client to inquire about the group membership of the server endpoint,
         * in a number of ways.
         */
        getGroupMembership: Command(2, TlvGetGroupMembershipRequest, 2, TlvGetGroupMembershipResponse),

        /**
         * The RemoveGroup command allows a client to request that the server removes the membership for the server
         * endpoint, if any, in a particular group.
         */
        removeGroup: Command(3, TlvRemoveGroupRequest, 3, TlvRemoveGroupResponse),

        /**
         * The RemoveAllGroups command allows a client to direct the server to remove all group associations for the
         * server endpoint.
         *
         * TODO: According to specs the response might be suppressed:
         * If the RemoveAllGroups command was received as unicast and a response is not suppressed, the server
         * SHALL generate a response with the Status field set to SUCCESS.
         * Else potentially no response?
         * 
         */
        removeAllGroups: Command(4, TlvNoArguments, 4, TlvRemoveAllGroupResponse),

        /**
         * The AddGroupIfIdentifying command allows a client to add group membership in a particular group for the
         * server endpoint, on condition that the endpoint is identifying itself.
         * 
         */
        addGroupIfIdentifying: Command(5, TlvAddGroupIfIdentifyingRequest, 5, TlvNoResponse),
    }
});
