/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec } from "./ClusterSpec";

export const BasicClusterSpec = ClusterSpec(
    0x28,
    "Basic",
    {
        vendorName: AttributeSpec(1, StringT),
        vendorId: AttributeSpec(2, UnsignedIntT),
        productName: AttributeSpec(3, StringT),
        productId: AttributeSpec(4, UnsignedIntT),
    },
    {},
);
