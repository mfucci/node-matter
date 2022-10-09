/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec } from "./ClusterSpec";

export const DescriptorClusterSpec = ClusterSpec(
    0x1d,
    "Descriptor",
    {
        deviceList: AttributeSpec(0, ArrayT(ObjectT({ type: Field(0, UnsignedIntT), revision: Field(1, UnsignedIntT) }))),
        serverList: AttributeSpec(1, ArrayT(UnsignedIntT)),
        clientList: AttributeSpec(3, ArrayT(UnsignedIntT)),
        partsList: AttributeSpec(4, ArrayT(UnsignedIntT)),
    },
    {},
);
