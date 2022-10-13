/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT, BooleanT, Field, ObjectT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec } from "./ClusterSpec";

const CapabilityMinimaT = ObjectT({
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
        vendorName: AttributeSpec(1, StringT), /* length: 32 */
        vendorId: AttributeSpec(2, UnsignedIntT),
        productName: AttributeSpec(3, StringT), /* length: 32 */
        productId: AttributeSpec(4, UnsignedIntT),
        nodeLabel: AttributeSpec(5, StringT), /* length: 32, default: "", writable: true */
        location: AttributeSpec(6, StringT), /* length: 2, default: "XX", writable: true */
        hardwareVersion: AttributeSpec(7, UnsignedIntT), /* default: 0 */
        hardwareVersionString: AttributeSpec(8, StringT), /* length: 64, minLength: 1 */
        softwareVersion: AttributeSpec(9, UnsignedIntT), /* default: 0 */
        softwareVersionString: AttributeSpec(10, StringT), /* length: 64, minLength: 1 */
        manufacturingDate: AttributeSpec(11, StringT),  /* optional: true, length: 16, minLength: 8 */
        partNumber: AttributeSpec(12, StringT), /* optional: true, length: 32 */
        productURL: AttributeSpec(13, StringT), /* optional: true, length: 256 */
        productLabel: AttributeSpec(14, StringT), /* optional: true, length: 64 */
        serialNumber: AttributeSpec(15, StringT), /* optional: true, length: 32 */
        localConfigDisabled: AttributeSpec(16, BooleanT), /* default: false, optional: true, writable: true */
        reachable: AttributeSpec(17, BooleanT), /* optional: true, default: true */
        uniqueId: AttributeSpec(18, UnsignedIntT), /* optional: true, length: 32 */
        capabilityMinima: AttributeSpec(19, CapabilityMinimaT), /* writable: false */
    },
    {},
);

/*
Events:
* server:
   * 0: StartUp,
   * 1: ShutDown,
   * 2: Leave
   * 3: ReachableChanged
 */
