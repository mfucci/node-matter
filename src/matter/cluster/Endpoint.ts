/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Session } from "../session/Session";
import { DescriptorCluster } from "../cluster/DescriptorCluster";
import { Attribute } from "./Attribute";
import { Cluster } from "./Cluster";

export class Endpoint<ContextT> {
    private readonly clustersMap = new Map<number, Cluster<ContextT>>();

    constructor(
        readonly id: number,
        readonly device: {name: string, code: number},
        clusterBuilders: ((endpointId: number) => Cluster<ContextT>)[],
    ) {
        clusterBuilders.forEach(clusterBuilder => {
            const cluster = clusterBuilder(id);
            this.clustersMap.set(cluster.id, cluster);
        });
    }

    addDescriptorCluster(endpoints: Endpoint<ContextT>[]) {
        const descriptorCluster = DescriptorCluster.Builder(endpoints)(this.id);
        this.clustersMap.set(descriptorCluster.id, descriptorCluster);
    }

    getAttributes(clusterId?: number, attributeId?: number): Attribute<any>[] {
        if (clusterId === undefined) {
            // If the clusterId is not provided, iterate over all clusters
            return [...this.clustersMap.values()].flatMap(cluster => cluster.getAttributes(attributeId));
        }
        
        const cluster = this.clustersMap.get(clusterId);
        if (cluster === undefined) return [];
        return cluster.getAttributes(attributeId);
    }

    getClusterIds() {
        return [...this.clustersMap.keys()];
    }

    async invoke(session: Session<ContextT>, clusterId: number, commandId: number, args: Element) {
        return this.clustersMap.get(clusterId)?.invoke(session, commandId, args);
    }
}
