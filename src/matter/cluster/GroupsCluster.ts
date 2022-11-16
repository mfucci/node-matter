/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Field,
    ObjectT,
    StringT,
    UInt8T,
    ArrayT,
    EnumT, BitMapT, Bit
} from "../../codec/TlvObjectCodec";
import { Attribute, Cluster, Command, NoArgumentsT, NoResponseT } from "./Cluster";
import { StatusCode } from "../interaction/InteractionMessages";
import { GroupIdT } from "../common/GroupId";
import { MatterApplicationClusterSpecificationV1_0 } from "../../Specifications";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.1 */
const AddGroupRequestT = ObjectT({
    groupId: Field(0, GroupIdT), /* min: 1 */
    groupName: Field(1, StringT({ maxLength: 16 })),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.7 */
const AddGroupResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT), /* type: min: 1 */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.2 */
const ViewGroupRequestT = ObjectT({
    groupId: Field(0, GroupIdT), /* type: min: 1 */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.8 */
const ViewGroupResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT), /* min: 1 */
    groupName: Field(2, StringT( { maxLength: 16 })),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.3 */
const GetGroupMembershipRequestT = ObjectT({
    groupList: Field(0, ArrayT(GroupIdT)), /* groupId min: 1 */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.9 */
const GetGroupMembershipResponseT = ObjectT({
    /** contain the remaining capacity of the Group Table of the node. */
    capacity: Field(0, UInt8T), /* nullable: true */
    groupList: Field(1, ArrayT(GroupIdT)), /* groupId min: 1 */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.4 */
const RemoveGroupRequestT = ObjectT({
    groupId: Field(0, GroupIdT), /* min: 1 */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.10 */
const RemoveGroupResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT), /* min: 1 */
});


/**
 * Formally not defined in specs state:
 * If the RemoveAllGroups command was received as unicast and a response is not
 * suppressed, the server SHALL generate a response with the Status field set to SUCCESS.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.5.1
 */
const RemoveAllGroupResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.6 */
const AddGroupIfIdentifyingRequestT = ObjectT({
    groupId: Field(0, GroupIdT), /* min: 1 */
    groupName: Field(1, StringT( { maxLength: 16 })),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.6.1 */
const nameSupportBitmapT = BitMapT({
    groupNames: Bit(7)
});

/**
 * The Groups cluster manages, per endpoint, the content of the node-wide Group
 * Table that is part of the underlying interaction layer.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3
 */
export const GroupsCluster = Cluster({
    id: 0x04,
    name: "Groups",
    revision: 4,
    features: {
        /** The ability to store a name for a group. */
        groupNames: Bit(0),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.6 */
    attributes: {
        /**
         * This attribute provides legacy, read-only access to whether the Group
         * Names feature is supported. The most significant bit, bit 7, SHALL be
         * equal to bit 0 of the FeatureMap attribute. All other bits SHALL be 0.
         *
         * TODO because we (will) support group names we need to set bit 7 to 1, rest is 0
         */
        nameSupport: Attribute(0, nameSupportBitmapT, { default: { groupNames: true } }),
    },
    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7 */
    commands: {
        /**
         * The AddGroup command allows a client to add group membership in a particular group for the server endpoint.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.1
         */
        addGroup: Command(0, AddGroupRequestT, 0, AddGroupResponseT),
        /**
         * The ViewGroup command allows a client to request that the server responds with a ViewGroupResponse command
         * containing the name string for a particular group.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.2
         */
        viewGroup: Command(1, ViewGroupRequestT, 0, ViewGroupResponseT),
        /**
         * The GetGroupMembership command allows a client to inquire about the group membership of the server endpoint,
         * in a number of ways.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.3
         */
        getGroupMembership: Command(2, GetGroupMembershipRequestT, 2, GetGroupMembershipResponseT),
        /**
         * The RemoveGroup command allows a client to request that the server removes the membership for the server
         * endpoint, if any, in a particular group.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.4
         */
        removeGroup: Command(3, RemoveGroupRequestT, 3, RemoveGroupResponseT),
        /**
         * The RemoveAllGroups command allows a client to direct the server to remove all group associations for the
         * server endpoint.
         *
         * TODO: According to specs the response might be suppressed:
         * If the RemoveAllGroups command was received as unicast and a response is not suppressed, the server
         * SHALL generate a response with the Status field set to SUCCESS.
         * Else potentially no response?
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.5
         */
        removeAllGroups: Command(4, NoArgumentsT, 4, RemoveAllGroupResponseT),
        /**
         * The AddGroupIfIdentifying command allows a client to add group membership in a particular group for the
         * server endpoint, on condition that the endpoint is identifying itself.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.3.7.6
         */
        addGroupIfIdentifying: Command(5, AddGroupIfIdentifyingRequestT, 5, NoResponseT),
    }
});
