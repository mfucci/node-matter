/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { MatterServer } from "../../matter/MatterServer";
import { Cluster } from "../model/Cluster";

interface BasicClusterConf {
    vendorName: string,
    vendorId: number,
    productName: string,
    productId: number,
}

export class BasicCluster extends Cluster<MatterServer> {
    static Builder = (conf: BasicClusterConf) => (endpointId: number) => new BasicCluster(endpointId, conf);

    constructor(endpointId: number, { vendorName, vendorId, productName, productId }: BasicClusterConf) {
        super(
            endpointId,
            0x28,
            "Basic",
        );

        this.addAttribute(1, "VendorName", StringT, vendorName);
        this.addAttribute(2, "VendorID", UnsignedIntT, vendorId);
        this.addAttribute(3, "ProductName", StringT, productName);
        this.addAttribute(4, "ProductID", UnsignedIntT, productId);
    }
}
