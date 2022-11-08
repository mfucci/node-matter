/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UInt16T, UInt32T } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";

const DeviceTypeT = ObjectT({
    type: Field(0, UInt32T), /* type: devtype-id */
    revision: Field(1, UInt16T),
});

/**
 * The Descriptor Cluster is meant to replace the support from the Zigbee Device Object (ZDO) for describing a node,
 * its endpoints and clusters.
 */
export const DescriptorCluster = Cluster({
    id: 0x1d,
    name: "Descriptor",
    revision: 1,
    attributes: {
        deviceTypeList: Attribute(0, ArrayT(DeviceTypeT, { minLength: 1 })),
        serverList: Attribute(1, ArrayT(UInt32T), { default: [] }), /* type: list[cluster-id] */
        clientList: Attribute(3, ArrayT(UInt32T), { default: [] }), /* type: list[cluster-id] */
        partsList: Attribute(4, ArrayT(UInt16T), { default: [] }), /* type: list[endpoint-no] */
    },
});
