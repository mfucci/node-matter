/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, StringT, ObjectT, Field, UInt16T, Bound, UInt32T } from "../../codec/TlvObjectCodec";
import { FabricIndexT } from "../common/FabricIndex";
import { VendorIdT } from "../common/VendorId";
import { AccessLevel, Attribute, Cluster, Event, EventPriority, OptionalAttribute, OptionalEvent, OptionalWritableAttribute, WritableAttribute } from "./Cluster";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";


/**
 * Provides constant values related to overall global capabilities of this Node, that are not cluster-specific.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.1.6.2
 */
const CapabilityMinimaT = ObjectT({
    /** Indicates the minimum number of concurrent CASE sessions that are supported per fabric. */
    caseSessionsPerFabric: Field(0, Bound(UInt16T, { min: 3 })),

    /** Indicate the actual minimum number of concurrent subscriptions supported per fabric. */
    subscriptionsPerFabric: Field(1, Bound(UInt16T, { min: 3 })),
});

/**
 * This cluster provides attributes and events for determining basic information about Nodes, which supports both
 * commissioning and operational determination of Node characteristics, such as Vendor ID, Product ID and serial number,
 * which apply to the whole Node. Also allows setting user device information such as location.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.1
 */
export const BasicInformationCluster = Cluster({
    id: 0x28,
    name: "Basic Information",
    revision: 1,

    /** @see {@link MatterCoreSpecificationV1_0} § 11.1.6.3 */
    attributes: {
        /** Revision number of the Data Model against which the Node is certified */
        dataModelRevision: Attribute(0, UInt16T),

        /** Human-readable (displayable) name of the vendor for the Node. */
        vendorName: Attribute(1, StringT({ maxLength: 32 })),

        /** Specifies the {@link VendorId}. */
        vendorId: Attribute(2, VendorIdT),

        /** Human-readable name of the model for the Node such as the model number assigned by the vendor. */
        productName: Attribute(3, StringT({ maxLength: 32 })),

        /** Product ID assigned by the vendor that is unique to the specific product of the Node. */
        productId: Attribute(4, UInt16T),

        /** User defined name for the Node. It is set during initial commissioning and may be updated by further reconfigurations. */
        nodeLabel: WritableAttribute(5, StringT({ maxLength: 32 }), { default: "", writeAcl: AccessLevel.Manage } ),

        /** ISO 3166-1 alpha-2 code where the Node is located. Might affect some regulatory aspects. */
        location: WritableAttribute(6, StringT({ length: 2 }), { default: "XX", writeAcl: AccessLevel.Administer } ),

        /** Version number of the hardware of the Node. The meaning of its value, and the versioning scheme, are vendor defined. */
        hardwareVersion: Attribute(7, UInt16T, { default: 0 }),

        /** Human-readable representation of the {@link BasicInformationCluster.attributes.hardwareVersion hardwareVersion} attribute. */
        hardwareVersionString: Attribute(8, StringT({ minLength: 1, maxLength: 64 })),

        /** Current version number for the software running on this Node. A larger value is newer than a lower value. */
        softwareVersion: Attribute(9, UInt32T, { default: 0 }),

        /** Human-readable representation of the {@link BasicInformationCluster.attributes.softwareVersion softwareVersion} attribute. */
        softwareVersionString: Attribute(10, StringT({ minLength: 1, maxLength: 64 })),

        /** Node manufacturing date formatted with YYYYMMDD. The additional 8 characters might include other vendor related information. */
        manufacturingDate: OptionalAttribute(11, StringT({ minLength: 8, maxLength: 16 })),

        /** Human-readable vendor assigned part number for the Node whose meaning and numbering scheme is vendor defined. */
        partNumber: OptionalAttribute(12, StringT({ maxLength: 32 })),

        /** Link to a product specific web page following the syntax as specified in RFC 3986. */
        productURL: OptionalAttribute(13, StringT({ maxLength: 256 })),

        /** Vendor specific human readable product label. */
        productLabel: OptionalAttribute(14, StringT({ maxLength: 64 })),

        /** Human readable serial number. */
        serialNumber: OptionalAttribute(15, StringT({ maxLength: 32 })),

        /** Allows to disable the ability to configure the Node through an on-Node user interface. */
        localConfigDisabled: OptionalWritableAttribute(16, BooleanT, { default: false, writeAcl: AccessLevel.Manage } ),

        /** Indicates whether the Node can be reached over the non-native network for bridged devices. */
        reachable: OptionalAttribute(17, BooleanT, { default: true }),

        /** Unique identifier for the device, which is constructed in a manufacturer specific manner, updated during factory reset. */
        uniqueId: OptionalAttribute(18, StringT({ maxLength: 32 })),

        /** Minimum guaranteed value for some system-wide, not cluster-specific, resource capabilities. */
        capabilityMinima: Attribute(19, CapabilityMinimaT, { default: { caseSessionsPerFabric: 3, subscriptionsPerFabric: 3 } }),
    },

    /** @see {@link MatterCoreSpecificationV1_0} § 11.1.6.5 */
    events: {
        /** First event fired as soon as reasonable after completing a boot or reboot process. */
        startUp: Event(0, EventPriority.Critical, { softwareVersion: Field(0, UInt32T) }),

        /** Last event fired prior to any orderly shutdown sequence on a best-effort basis. */
        shutDown: OptionalEvent(1, EventPriority.Critical),

        /** Fired prior to permanently leaving a given Fabric. */
        leave: OptionalEvent(2, EventPriority.Info, { fabricIndex: Field(0, FabricIndexT) }),

        /** Fired when there is a change in the {@link BasicInformationCluster.attributes.reachable reachable} attribute. */
        reachableChanged: OptionalEvent(3, EventPriority.Info, { reachableNewValue: Field(0, BooleanT) }),
    },
});
