/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UnsignedIntT } from "../../../codec/TlvObjectCodec";
import { Cluster } from "../model/Cluster";
import { Endpoint } from "../model/Endpoint";

const CLUSTER_ID = 0x1d;

export class DescriptorCluster<ContextT> extends Cluster<ContextT> {
    static Builder = <ContextT,>(allEndpoints: Endpoint<ContextT>[]) => (endpointId: number) => new DescriptorCluster<ContextT>(endpointId, allEndpoints);

    constructor(endpointId: number, allEndpoints: Endpoint<ContextT>[]) {
        super(
            endpointId,
            0x1d,
            "Descriptor",
        );
        const endpoint = allEndpoints.find(endpoint => endpoint.id === endpointId);
        if (endpoint === undefined) throw new Error(`Endpoint with id ${endpointId} doesn't exist`);
        
        this.addAttribute(0, "DeviceList", ArrayT(ObjectT({
            type: Field(0, UnsignedIntT),
            revision: Field(1, UnsignedIntT),
        })), [{
            type: endpoint.device.code,
            revision: 1,
        }]);
        this.addAttribute(1, "ServerList", ArrayT(UnsignedIntT), [CLUSTER_ID, ...endpoint.getClusterIds()]);
        this.addAttribute(3, "ClientList", ArrayT(UnsignedIntT), []);
        this.addAttribute(4, "PartsList", ArrayT(UnsignedIntT), endpointId === 0 ? allEndpoints.map(endpoint => endpoint.id).filter(endpointId => endpointId !== 0) : []);
    }
}
