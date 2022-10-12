/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec } from "./ClusterSpec";

const DeviceTypeStructT = ObjectT({
  type: Field(0, UnsignedIntT),
  revision: Field(1, UnsignedIntT),
});

/**
 * The Descriptor Cluster is meant to replace the support from the Zigbee Device Object (ZDO) for describing a node,
 * its endpoints and clusters.
 */
export const DescriptorClusterSpec = ClusterSpec(
    0x1d,
    "Descriptor",
    {
        deviceTypeList: AttributeSpec(0, ArrayT(DeviceTypeStructT)),
        serverList: AttributeSpec(1, ArrayT(UnsignedIntT)),
        clientList: AttributeSpec(2, ArrayT(UnsignedIntT)),
        partsList: AttributeSpec(3, ArrayT(UnsignedIntT)),
    },
    {},
);
