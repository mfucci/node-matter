/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { StringT, UnsignedIntT } from "../../../codec/TlvObjectCodec";
import { MatterServer } from "../../MatterServer";
import { Cluster } from "../model/Cluster";
import { AttributeDef, ClusterDef } from "./ClusterDef";

interface BasicClusterConf {
    vendorName: string,
    vendorId: number,
    productName: string,
    productId: number,
}

// TODO: auto-generate this from BasicClusterDef
export class BasicClusterServer extends Cluster<MatterServer> {
    static Builder = (conf: BasicClusterConf) => (endpointId: number) => new BasicClusterServer(endpointId, conf);

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

export const BasicClusterDef = ClusterDef(
    0x28,
    "Basic",
    {
        vendorName: AttributeDef(1, StringT),
        vendorId: AttributeDef(2, UnsignedIntT),
        productName: AttributeDef(3, StringT),
        productId: AttributeDef(4, UnsignedIntT),
    },
    {},
);
