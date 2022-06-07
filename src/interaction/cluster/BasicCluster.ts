/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute } from "../model/Attribute";
import { Cluster } from "../model/Cluster";

interface BasicClusterConf {
    vendorName: string,
    vendorId: number,
    productName: string,
    productId: number,
}

export class BasicCluster extends Cluster {
    constructor({ vendorName, vendorId, productName, productId }: BasicClusterConf) {
        super(
            0x28,
            "Basic",
            [],
            [
                new Attribute(1, "VendorName", StringT, vendorName),
                new Attribute(2, "VendorID", UnsignedIntT, vendorId),
                new Attribute(3, "ProductName", StringT, productName),
                new Attribute(4, "ProductID", UnsignedIntT, productId),
            ],
        );
    }
}
