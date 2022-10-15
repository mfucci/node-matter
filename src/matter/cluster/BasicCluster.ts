/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, StringT, UnsignedIntT, ObjectT, Field } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster, OptionalAttribute, OptionalWritableAttribute, WritableAttribute } from "./Cluster";

const CapabilityMinimaT = ObjectT({
    caseSessionsPerFabric: Field(0, UnsignedIntT),
    subscriptionsPerFabric: Field(1, UnsignedIntT),
});

/**
 * This cluster provides attributes and events for determining basic information about Nodes, which supports both
 * commissioning and operational determination of Node characteristics, such as Vendor ID, Product ID and serial number,
 * which apply to the whole Node. Also allows setting user device information such as location.
 */
export const BasicCluster = Cluster(
    0x28,
    "Basic",
    {
        dataModelRevision: Attribute(0, UnsignedIntT),
        vendorName: Attribute(1, StringT), /* length: 32 */
        vendorId: Attribute(2, UnsignedIntT),
        productName: Attribute(3, StringT), /* length: 32 */
        productId: Attribute(4, UnsignedIntT),
        nodeLabel: WritableAttribute(5, StringT, ""), /* maxLength: 32, writeAcl: manage */
        location: WritableAttribute(6, StringT, "XX"), /* length: 2, writeAcl: administer */
        hardwareVersion: Attribute(7, UnsignedIntT, 0),
        hardwareVersionString: Attribute(8, StringT), /* maxlength: 64, minLength: 1 */
        softwareVersion: Attribute(9, UnsignedIntT, 0),
        softwareVersionString: Attribute(10, StringT), /* length: 64, minLength: 1 */
        manufacturingDate: OptionalAttribute(11, StringT),  /* maxLength: 16, minLength: 8 */
        partNumber: OptionalAttribute(12, StringT), /* maxLength: 32 */
        productURL: OptionalAttribute(13, StringT), /* maxLength: 256 */
        productLabel: OptionalAttribute(14, StringT), /* maxLength: 64 */
        serialNumber: OptionalAttribute(15, StringT), /* maxLength: 32 */
        localConfigDisabled: OptionalWritableAttribute(16, BooleanT, false), /* writeAcl: manage */
        reachable: OptionalAttribute(17, BooleanT, true),
        uniqueId: OptionalAttribute(18, StringT), /* maxLength: 32 */
        capabilityMinima: Attribute(19, CapabilityMinimaT),
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
