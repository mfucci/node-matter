/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessLevel, Cluster, WritableAttribute, Attribute, Event, EventPriority, OptionalWritableAttribute } from "./Cluster";
import { TlvClusterId } from "../common/ClusterId";
import { TlvEndpointNumber } from "../common/EndpointNumber";
import { TlvDeviceTypeId } from "../common/DeviceTypeId";
import { TlvNodeId } from "../common/NodeId";
import { TlvSubjectId } from "../common/SubjectId";
import { MatterCoreSpecificationV1_0, TlvArray, TlvByteString, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt16 } from "@project-chip/matter.js";

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
const TlvTarget = TlvObject({
    /** Cluster to grant access on. */
    cluster: TlvField(0, TlvNullable(TlvClusterId)),

    /** Endpoint to grant access on. */
    endpoint: TlvField(1, TlvNullable(TlvEndpointNumber)),

    /** Device type to grant access on. */
    deviceType: TlvField(1, TlvNullable(TlvDeviceTypeId)),
});

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.5.3 */
const TlvAccessControlEntry = TlvObject({
    /** Specifies the level of privilege granted by this Access Control Entry. */
    privilege: TlvField(1, TlvEnum<Privilege>()),

    /** Specifies the authentication mode required by this Access Control Entry. */
    authMode: TlvField(2, TlvEnum<AuthMode>()),

    /** Specifies a list of Subject IDs, to which this Access Control Entry grants access. */
    subjects: TlvField(3, TlvNullable(TlvArray(TlvSubjectId))), /* maxArrayLength: subjectsPerAccessControlEntry */

    /** Specifies a list of TargetStruct, which define the clusters on this Node to which this Access Control Entry grants access. */
    targets: TlvField(4, TlvNullable(TlvArray(TlvTarget))), /* maxArrayLength: targetsPerAccessControlEntry */
});

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.5.4 */
const TlvAccessControlExtensionEntry = TlvObject({
    /** Used by manufacturers to store arbitrary TLV-encoded data related to a fabric’s Access Control Entries. */
    data: TlvField(1, TlvByteString.bound({ maxLength: 128 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 9.10.7.1 */
const AccessChangeEvent = <T>(entrySchema: TlvSchema<T>) => ({
    /** The Node ID of the Administrator that made the change, if the change occurred via a CASE session. */
    adminNodeID: TlvField(1, TlvNullable(TlvNodeId)),

    /** The Passcode ID of the Administrator that made the change, if the change occurred via a PASE session. */
    adminPasscodeID: TlvField(2, TlvNullable(TlvUInt16)),

    /** The type of change as appropriate. */
    changeType: TlvField(3, TlvEnum<ChangeTypeEnum>()),

    /** The latest value of the changed entry. */
    latestValue: TlvField(4, TlvNullable(entrySchema)),
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
    id: 0x1f,
    name: "Access Control",
    revision: 1,

    /** @see {@link MatterCoreSpecificationV1_0} § 9.10.5 */
    attributes: {
        /** Codifies a single grant of privilege on this Node. */
        acl: WritableAttribute(0, TlvArray(TlvAccessControlEntry), { default: [], writeAcl: AccessLevel.Administer, readAcl: AccessLevel.Administer }),

        /** MAY be used by Administrators to store arbitrary data related to fabric’s Access Control Entries. */
        extension: OptionalWritableAttribute(1, TlvArray(TlvAccessControlExtensionEntry), { default: [], writeAcl: AccessLevel.Administer, readAcl: AccessLevel.Administer }),

        /** Provide the minimum number of Subjects per entry that are supported by this server. */
        subjectsPerAccessControlEntry: Attribute(2, TlvUInt16.bound({ min: 4 }), { default: 4 }),

        /** Provides the minimum number of Targets per entry that are supported by this server. */
        targetsPerAccessControlEntry: Attribute(3, TlvUInt16.bound({ min: 3 }), { default: 3 }),

        /** Provides the minimum number of ACL Entries per fabric that are supported by this server. */
        accessControlEntriesPerFabric: Attribute(4, TlvUInt16.bound({ min: 3 }), { default: 3 }),
    },

    /** @see {@link MatterCoreSpecificationV1_0} § 9.10.7 */
    events: {
        /**
         * The cluster SHALL send AccessControlEntryChanged events whenever its ACL attribute data is changed by an
         * Administrator.
         */
        accessControlEntryChanged: Event(0, EventPriority.Info, AccessChangeEvent(TlvAccessControlEntry)), /* readAcl: AccessLevel.Administer */

        /**
         * The cluster SHALL send AccessControlExtensionChanged events whenever its extension attribute data is changed
         * by an Administrator.
         */
        accessControlExtensionChanged: Event(1, EventPriority.Info, AccessChangeEvent(TlvAccessControlExtensionEntry)), /* readAcl: AccessLevel.Administer */
    },
});
