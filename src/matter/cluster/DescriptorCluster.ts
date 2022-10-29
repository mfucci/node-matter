/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";

const DeviceTypeT = ObjectT({
    type: Field(0, UnsignedIntT), /* type: devtype-id */
    revision: Field(1, UnsignedIntT),
});

/**
 * The Descriptor Cluster is meant to replace the support from the Zigbee Device Object (ZDO) for describing a node,
 * its endpoints and clusters.
 */
export const DescriptorCluster = Cluster({
    id: 0x1d,
    name: "Descriptor",
    attributes: {
        deviceTypeList: Attribute(0, ArrayT(DeviceTypeT, { minLength: 1 })),
        serverList: Attribute(1, ArrayT(UnsignedIntT), { default: [] }), /* type: list[cluster-id] */
        clientList: Attribute(3, ArrayT(UnsignedIntT), { default: [] }), /* type: list[cluster-id] */
        partsList: Attribute(4, ArrayT(UnsignedIntT), { default: [] }), /* type: list[endpoint-no] */
    },
});
