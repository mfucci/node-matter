/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ArrayT,
    Bound,
    UInt16T,
    ByteStringT,
    EnumT,
    Field,
    ObjectT,
    Template
} from "../../codec/TlvObjectCodec";
import {
    AccessLevel,
    Cluster,
    WritableAttribute,
    Attribute,
    Event,
    EventPriority,
    OptionalWritableAttribute
} from "./Cluster";
import { ClusterIdT } from "../common/ClusterId";
import { EndpointNumberT } from "../common/EndpointNumber";
import { DeviceTypeIdT } from "../common/DeviceTypeId";
import { NodeIdT } from "../common/NodeId";
import { SubjectIdT } from "../common/SubjectId";

/**
 * List of privileges that can be granted to a subject.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.10.5.3
 */
export const enum Privilege {
    /** Can read and observe all (except Access Control Cluster and as seen by a non-Proxy). */
    View = 1,
    /** An read and observe all (as seen by a Proxy). */
    ProxyView = 2,
    /** View privileges, and can perform the primary function of this Node (except Access Control Cluster). */
    Operate = 3,
    /** Operate privileges, and can modify persistent configuration of this Node (except Access Control Cluster). */
    Manage = 4,
    /** Manage privileges, and can observe and modify the Access Control Cluster. */
    Administer = 5,
}

/**
 * List of Auth Modes that can be used to authenticate a subject.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.10.5.3
 */
export const enum AuthMode {
    /** Passcode authenticated session. */
    PASE = 1,
    /** Certificate authenticated session. */
    CASE = 2,
    /** Group authenticated session. */
    Group = 3,
}

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.8.1 */
export const enum ChangeTypeEnum {
    /** Entry or extension was changed. */
    Changed = 0,
    /** Entry or extension was added. */
    Added = 1,
    /** Entry or extension was removed. */
    Removed = 2,
}

/**
 *
 * Defines the clusters on this Node to which this Access Control Entry grants access.
 *
 * A single target SHALL contain at least one field (Cluster, Endpoint, or DeviceType), and SHALL NOT
 * contain both an Endpoint field and a DeviceType field.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.10.5.3
 */
const TargetT = ObjectT({
    /** Cluster to grant access on. */
    cluster: Field(0, ClusterIdT), /* nullable: true */
    /** Endpoint to grant access on. */
    endpoint: Field(1, EndpointNumberT), /* nullable: true */
    /** Device type to grant access on. */
    deviceType: Field(1, DeviceTypeIdT), /* nullable: true */
});

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.5.3 */
const AccessControlEntryT = ObjectT({
    /** Specifies the level of privilege granted by this Access Control Entry. */
    privilege: Field(1, EnumT<Privilege>()),
    /** Specifies the authentication mode required by this Access Control Entry. */
    authMode: Field(2, EnumT<AuthMode>()),
    /** Specifies a list of Subject IDs, to which this Access Control Entry grants access. */
    subjects: Field(3, ArrayT(SubjectIdT)), /* nullable: true, maxArrayLength: subjectsPerAccessControlEntry */
    /** Specifies a list of TargetStruct, which define the clusters on this Node to which this Access Control Entry grants access. */
    targets: Field(4, ArrayT(TargetT)), /* nullable: true, maxArrayLength: targetsPerAccessControlEntry */
});

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.5.4 */
const AccessControlExtensionEntryT = ObjectT({
    /** Used by manufacturers to store arbitrary TLV-encoded data related to a fabric’s Access Control Entries. */
    data: Field(1, ByteStringT({ maxLength: 128 })),
});

const AccessChangeEvent = <T>(entryTemplate: Template<T>) => ({
    /** The Node ID of the Administrator that made the change, if the change occurred via a CASE session. */
    adminNodeID: Field(0, NodeIdT), /* nullable: true */
    /** The Passcode ID of the Administrator that made the change, if the change occurred via a PASE session. */
    adminPasscodeID: Field(1, Bound(UInt16T)), /* nullable: true */
    /** The type of change as appropriate. */
    changeType: Field(2, EnumT<ChangeTypeEnum>()),
});

/**
 * The Access Control Cluster exposes a data model view of a Node’s Access Control List (ACL),
 * which codifies the rules used to manage and enforce Access Control for the Node’s endpoints
 * and their associated cluster instances. Access to this Access Control Cluster itself requires
 * a special Administer privilege level, such that only Nodes granted such privilege (hereafter
 * termed "Administrators") can manage the Access Control Cluster.
 * The Access Control Cluster SHALL be present on the root node endpoint of each Node, and SHALL
 * NOT be present on any other Endpoint of any Node.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.10
 */
export const AccessControlCluster = Cluster({
    /** Is a base cluster, so no id */
    id: 0x1f,
    name: "Access Control",
    revision: 1,

    /** @see {@link MatterCoreSpecificationV1_0} § 9.10.5 */
    attributes: {
        /** Codifies a single grant of privilege on this Node. */
        acl: WritableAttribute(0, ArrayT(AccessControlEntryT), { default: [], writeAcl: AccessLevel.Administer, readAcl: AccessLevel.Administer }),
        /** MAY be used by Administrators to store arbitrary data related to fabric’s Access Control Entries. */
        extension: OptionalWritableAttribute(1, ArrayT(AccessControlExtensionEntryT), { default: [], writeAcl: AccessLevel.Administer, readAcl: AccessLevel.Administer }),
        /** Provide the minimum number of Subjects per entry that are supported by this server. */
        subjectsPerAccessControlEntry: Attribute(2, Bound(UInt16T, { min: 4 }), { default: 4 }),
        /** Provides the minimum number of Targets per entry that are supported by this server. */
        targetsPerAccessControlEntry: Attribute(3, Bound(UInt16T, { min: 3 }), { default: 3 }),
        /** Provides the minimum number of ACL Entries per fabric that are supported by this server. */
        accessControlEntriesPerFabric: Attribute(4, Bound(UInt16T, { min: 3 }), { default: 3 }),
    },

    /** @see {@link MatterCoreSpecificationV1_0} § 9.10.7 */
    events: {
        /**
         * The cluster SHALL send AccessControlEntryChanged events whenever its ACL attribute data is changed by an
         * Administrator.
         * @see {@link MatterCoreSpecificationV1_0} § 9.10.7.1
         */
        accessControlEntryChanged: Event(0, EventPriority.Info, {
            ... AccessChangeEvent,
            /** The latest value of the changed entry. */
            latestValue: Field(3, AccessControlEntryT), /* nullable: true */
        }), /* readAcl: AccessLevel.Administer */

        /**
         * The cluster SHALL send AccessControlExtensionChanged events whenever its extension attribute data is changed
         * by an Administrator.
         * @see {@link MatterCoreSpecificationV1_0} § 9.10.7.2
         */
        accessControlExtensionChanged: Event(1, EventPriority.Info, {
            ... AccessChangeEvent,
            /** The latest value of the changed entry. */
            latestValue: Field(3, AccessControlExtensionEntryT), /* nullable: true */
        }), /* readAcl: AccessLevel.Administer */
    },
});
