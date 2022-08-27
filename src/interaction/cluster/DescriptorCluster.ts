/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { Attribute } from "../model/Attribute";
import { Cluster } from "../model/Cluster";
import { Endpoint } from "../model/Endpoint";

const CLUSTER_ID = 0x1d;

export class DescriptorCluster extends Cluster {
    constructor(endpoint: Endpoint, allEndpoints: Endpoint[]) {
        super(
            CLUSTER_ID,
            "Descriptor",
            [],
            [
                new Attribute(0, "DeviceList", ArrayT(ObjectT({
                    type: Field(0, UnsignedIntT),
                    revision: Field(1, UnsignedIntT),
                })), [{
                    type: endpoint.type,
                    revision: 1,
                }]),
                new Attribute(1, "ServerList", ArrayT(UnsignedIntT), [CLUSTER_ID, ...endpoint.getClusterIds()]),
                new Attribute(3, "ClientList", ArrayT(UnsignedIntT), []),
                new Attribute(4, "PartsList", ArrayT(UnsignedIntT), endpoint.id === 0 ? allEndpoints.map(endpoint => endpoint.id).filter(endpointId => endpointId !== 0) : []),
            ],
        );
    }
}
