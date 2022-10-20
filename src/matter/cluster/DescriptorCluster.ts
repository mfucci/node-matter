/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";

export const DescriptorCluster = Cluster(
    0x1d,
    "Descriptor",
    {
        deviceList: Attribute(0, ArrayT(ObjectT({ type: Field(0, UnsignedIntT), revision: Field(1, UnsignedIntT) }))),
        serverList: Attribute(1, ArrayT(UnsignedIntT)),
        clientList: Attribute(3, ArrayT(UnsignedIntT)),
        partsList: Attribute(4, ArrayT(UnsignedIntT)),
    },
    {},
);
