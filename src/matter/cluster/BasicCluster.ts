/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT, BooleanT, Field, ObjectT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec } from "./ClusterSpec";

const CapabilityMinimaStructT = ObjectT({
  caseSessionsPerFabric: Field(0, UnsignedIntT),
  subscriptionsPerFabric: Field(1, UnsignedIntT),
});

/**
 * This cluster provides attributes and events for determining basic information about Nodes, which supports both
 * Commissioning and operational determination of Node characteristics, such as Vendor ID, Product ID and serial number,
 * which apply to the whole Node. Also allows setting user device information such as location.
 */
export const BasicClusterSpec = ClusterSpec(
    0x28,
    "Basic",
    {
        dataModelRevision: AttributeSpec(0, UnsignedIntT),
        vendorName: AttributeSpec(1, StringT),
        vendorId: AttributeSpec(2, UnsignedIntT),
        productName: AttributeSpec(3, StringT),
        productId: AttributeSpec(4, UnsignedIntT),
        nodeLabel: AttributeSpec(5, StringT, ''),
        location: AttributeSpec(6, StringT, 'XX'),
        hardwareVersion: AttributeSpec(7, UnsignedIntT, 0),
        hardwareVersionString: AttributeSpec(8, StringT),
        softwareVersion: AttributeSpec(9, UnsignedIntT, 0),
        softwareVersionString: AttributeSpec(10, StringT),
        manufacturingDate: AttributeSpec(11, StringT ), // optional
        partNumber: AttributeSpec(12, StringT), // optional
        productURL: AttributeSpec(13, StringT), // optional
        productLabel: AttributeSpec(14, StringT), // optional
        serialNumber: AttributeSpec(15, StringT), // optional
        localConfigDisabled: AttributeSpec(16, BooleanT, true), // optional
        reachable: AttributeSpec(17, BooleanT), // optional
        uniqueId: AttributeSpec(18, UnsignedIntT), // optional
        capabilityMinima: AttributeSpec(19, CapabilityMinimaStructT),
    },
    {},
);
