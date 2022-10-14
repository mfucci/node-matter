/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";

export const BasicCluster = Cluster(
    0x28,
    "Basic",
    {
        vendorName: Attribute(1, StringT),
        vendorId: Attribute(2, UnsignedIntT),
        productName: Attribute(3, StringT),
        productId: Attribute(4, UnsignedIntT),
    },
    {},
);
