/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvFabricIndex } from "../common/FabricIndex";
import { TlvVendorId } from "../common/VendorId";
import { AccessLevel, Attribute, Cluster, Event, EventPriority, OptionalAttribute, OptionalEvent, OptionalWritableAttribute } from "./Cluster";
import { tlv, spec } from "@project-chip/matter.js";

/**
 * This Cluster serves two purposes towards a Node communicating with a Bridge:
 * * indicate that the functionality on the Endpoint where it is placed (and its Parts) is bridged from a
 *   non-Matter technology, and
 * * provide a centralized collection of attributes that the Node MAY collect to aid in conveying information
 *   regarding the Bridged Device to a user, such as the vendor name, the model name, or user-assigned name.
 *
 * This cluster is Derived from Basic Information Cluster.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.13
 */
export const BasicInformationCluster = Cluster({
    id: 0x39,
    name: "Bridged Device Basic Information",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 9.13.6 */
    attributes: {
        /** Human-readable (displayable) name of the vendor for the Node. */
        vendorName: OptionalAttribute(1, tlv.String32max),

        /** Specifies the {@link VendorId}. */
        vendorId: OptionalAttribute(2, TlvVendorId),

        /** Human-readable name of the model for the Node such as the model number assigned by the vendor. */
        productName: OptionalAttribute(3, tlv.String32max),

        /** User defined name for the Node. It is set during initial commissioning and may be updated by further reconfigurations. */
        nodeLabel: OptionalWritableAttribute(5, tlv.String32max, { default: "", writeAcl: AccessLevel.Manage } ),

        /** Version number of the hardware of the Node. The meaning of its value, and the versioning scheme, are vendor defined. */
        hardwareVersion: OptionalAttribute(7, tlv.UInt16, { default: 0 }),

        /** Human-readable representation of the {@link BasicInformationCluster.attributes.hardwareVersion hardwareVersion} attribute. */
        hardwareVersionString: OptionalAttribute(8, tlv.String.bound({ minLength: 1, maxLength: 64 })),

        /** Current version number for the software running on this Node. A larger value is newer than a lower value. */
        softwareVersion: OptionalAttribute(9, tlv.UInt32, { default: 0 }),

        /** Human-readable representation of the {@link BasicInformationCluster.attributes.softwareVersion softwareVersion} attribute. */
        softwareVersionString: OptionalAttribute(10, tlv.String.bound({ minLength: 1, maxLength: 64 })),

        /** Node manufacturing date formatted with YYYYMMDD. The additional 8 characters might include other vendor related information. */
        manufacturingDate: OptionalAttribute(11, tlv.String.bound({ minLength: 8, maxLength: 16 })),

        /** Human-readable vendor assigned part number for the Node whose meaning and numbering scheme is vendor defined. */
        partNumber: OptionalAttribute(12, tlv.String32max),

        /** Link to a product specific web page following the syntax as specified in RFC 3986. */
        productURL: OptionalAttribute(13, tlv.String256max),

        /** Vendor specific human readable product label. */
        productLabel: OptionalAttribute(14, tlv.String64max),

        /** Human-readable serial number. */
        serialNumber: OptionalAttribute(15, tlv.String32max),

        /** Indicates whether the bridged device is reachable by the bridge over the non-Matter network. */
        reachable: Attribute(17, tlv.Boolean, { default: true }),

        /** Unique identifier for the device, which is constructed in a manufacturer specific manner, updated during factory reset. */
        uniqueId: OptionalAttribute(18, tlv.String32max),
    },

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 11.1.6.5 */
    events: {
        /** First event fired as soon as reasonable after completing a boot or reboot process. */
        startUp: OptionalEvent(0, EventPriority.Critical, { softwareVersion: tlv.Field(0, tlv.UInt32) }),

        /** Last event fired prior to any orderly shutdown sequence on a best-effort basis. */
        shutDown: OptionalEvent(1, EventPriority.Critical),

        /** Fired prior to permanently leaving a given Fabric. */
        leave: OptionalEvent(2, EventPriority.Info, { fabricIndex: tlv.Field(0, TlvFabricIndex) }),

        /** Fired when there is a change in the {@link BasicInformationCluster.attributes.reachable reachable} attribute */
        reachableChanged: Event(3, EventPriority.Info, { reachableNewValue: tlv.Field(0, tlv.Boolean) }),
    },
});
