/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, StringT, UnsignedIntT, ObjectT, Field, BoundedUnsignedIntT } from "../../codec/TlvObjectCodec";
import { FabricIndexT } from "../common/FabricIndex";
import { VendorIdT } from "../common/VendorId";
import { AccessLevel, Attribute, Cluster, Event, EventPriority, OptionalAttribute, OptionalEvent, OptionalWritableAttribute, WritableAttribute } from "./Cluster";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";


/** @see {@link MatterCoreSpecificationV1_0} § 11.1.6.2 */
const CapabilityMinimaT = ObjectT({
    caseSessionsPerFabric: Field(0, BoundedUnsignedIntT({ min: 3 })),
    subscriptionsPerFabric: Field(1, BoundedUnsignedIntT({ min: 3 })),
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
    attributes: {
        dataModelRevision: Attribute(0, UnsignedIntT),
        vendorName: Attribute(1, StringT({ maxLength: 32 })),
        vendorId: Attribute(2, VendorIdT),
        productName: Attribute(3, StringT({ maxLength: 32 })),
        productId: Attribute(4, UnsignedIntT),
        nodeLabel: WritableAttribute(5, StringT({ maxLength: 32 }), { default: "", writeAcl: AccessLevel.Manage } ),
        location: WritableAttribute(6, StringT({ length: 2 }), { default: "XX", writeAcl: AccessLevel.Administer } ),
        hardwareVersion: Attribute(7, UnsignedIntT, { default: 0 }),
        hardwareVersionString: Attribute(8, StringT({ minLength: 1, maxLength: 64 })),
        softwareVersion: Attribute(9, UnsignedIntT, { default: 0 }),
        softwareVersionString: Attribute(10, StringT({ minLength: 1, maxLength: 64 })),
        manufacturingDate: OptionalAttribute(11, StringT({ minLength: 8, maxLength: 16 })),
        partNumber: OptionalAttribute(12, StringT({ maxLength: 32 })),
        productURL: OptionalAttribute(13, StringT({ maxLength: 256 })),
        productLabel: OptionalAttribute(14, StringT({ maxLength: 64 })),
        serialNumber: OptionalAttribute(15, StringT({ maxLength: 32 })),
        localConfigDisabled: OptionalWritableAttribute(16, BooleanT, { default: false, writeAcl: AccessLevel.Manage } ),
        reachable: OptionalAttribute(17, BooleanT, { default: true }),
        uniqueId: OptionalAttribute(18, StringT({ maxLength: 32 })),
        capabilityMinima: Attribute(19, CapabilityMinimaT, { default: { caseSessionsPerFabric: 3, subscriptionsPerFabric: 3 } }),
    },
    events: {
        startUp: Event(0, EventPriority.Critical, { softwareVersion: Field(0, UnsignedIntT) }),
        shutDown: OptionalEvent(1, EventPriority.Critical),
        leave: OptionalEvent(2, EventPriority.Info, { fabricIndex: Field(0, FabricIndexT) }),
        reachableChanged: OptionalEvent(3, EventPriority.Info, { reachableNewValue: Field(0, BooleanT) }),
    },
});
