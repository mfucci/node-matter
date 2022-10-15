/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";

const DeviceTypeT = ObjectT({
  type: Field(0, UnsignedIntT),
  revision: Field(1, UnsignedIntT),
});

/**
 * The Descriptor Cluster is meant to replace the support from the Zigbee Device Object (ZDO) for describing a node,
 * its endpoints and clusters.
 */
export const DescriptorCluster = Cluster(
    0x1d,
    "Descriptor",
    {
        deviceTypeList: Attribute(0, ArrayT(DeviceTypeT)),
        serverList: Attribute(1, ArrayT(UnsignedIntT)),
        clientList: Attribute(3, ArrayT(UnsignedIntT)),
        partsList: Attribute(4, ArrayT(UnsignedIntT)),
    },
    {},
);
