/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, StringT, UnsignedIntT, ObjectT, Field, BoundedUnsignedIntT, Typed } from "../../codec/TlvObjectCodec";
import { VendorId } from "../common/VendorId";
import { Attribute, Cluster, OptionalAttribute, OptionalWritableAttribute, WritableAttribute } from "./Cluster";

const CapabilityMinimaT = ObjectT({
        caseSessionsPerFabric: Field(0, BoundedUnsignedIntT({ min: 3 })),
        subscriptionsPerFabric: Field(1, BoundedUnsignedIntT({ min: 3 })),
});

/**
 * This cluster provides attributes and events for determining basic information about Nodes, which supports both
 * commissioning and operational determination of Node characteristics, such as Vendor ID, Product ID and serial number,
 * which apply to the whole Node. Also allows setting user device information such as location.
 * 
 * @see [Matter Specification R1.0], section 11.1
 */
export const BasicInformationCluster = Cluster(
    0x28,
    "Basic Information",
    {
            dataModelRevision: Attribute(0, UnsignedIntT),
            vendorName: Attribute(1, StringT({ maxLength: 32 })),
            vendorId: Attribute(2, Typed<VendorId>(UnsignedIntT)),
            productName: Attribute(3, StringT({ maxLength: 32 })),
            productId: Attribute(4, UnsignedIntT),
            nodeLabel: WritableAttribute(5, StringT({ maxLength: 32 }), ""), /* writeAcl: manage */
            location: WritableAttribute(6, StringT({ length: 2 }), "XX"), /* writeAcl: administer */
            hardwareVersion: Attribute(7, UnsignedIntT, 0),
            hardwareVersionString: Attribute(8, StringT({ minLength: 1, maxLength: 64 })),
            softwareVersion: Attribute(9, UnsignedIntT, 0),
            softwareVersionString: Attribute(10, StringT({ minLength: 1, maxLength: 64 })),
            manufacturingDate: OptionalAttribute(11, StringT({ minLength: 8, maxLength: 16 })),
            partNumber: OptionalAttribute(12, StringT({ maxLength: 32 })),
            productURL: OptionalAttribute(13, StringT({ maxLength: 256 })),
            productLabel: OptionalAttribute(14, StringT({ maxLength: 64 })),
            serialNumber: OptionalAttribute(15, StringT({ maxLength: 32 })),
            localConfigDisabled: OptionalWritableAttribute(16, BooleanT, false), /* writeAcl: manage */
            reachable: OptionalAttribute(17, BooleanT, true),
            uniqueId: OptionalAttribute(18, StringT({ maxLength: 32 })),
            capabilityMinima: Attribute(19, CapabilityMinimaT, { caseSessionsPerFabric: 3, subscriptionsPerFabric: 3 }),
    },
    {},
);

/*
Events:
    <event side="server" code="0x00" name="StartUp" priority="critical" optional="false">
      <description>The StartUp event SHALL be emitted by a Node as soon as reasonable after completing a boot or reboot process.</description>
      <field id="0" name="SoftwareVersion" type="INT32U"/>
    </event>
    <event side="server" code="0x01" name="ShutDown" priority="critical" optional="false">
      <description>The ShutDown event SHOULD be emitted by a Node prior to any orderly shutdown sequence on a best-effort basis.</description>
    </event>
    <event side="server" code="0x02" name="Leave" priority="info" optional="false">
      <description>The Leave event SHOULD be emitted by a Node prior to permanently leaving the Fabric.</description>
      <field id="0" name="FabricIndex" type="fabric_idx"/>
    </event>
    <event side="server" code="0x03" name="ReachableChanged" priority="info" optional="true">
      <description>This event (when supported) SHALL be generated when there is a change in the Reachable attribute.</description>
      <field id="0" name="ReachableNewValue" type="boolean"/>
    </event>

*/
