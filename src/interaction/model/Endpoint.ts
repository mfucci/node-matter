/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Session } from "../../session/Session";
import { DescriptorCluster } from "../cluster/DescriptorCluster";
import { Cluster } from "./Cluster";

export class Endpoint {
    private readonly clustersMap = new Map<number, Cluster>();

    constructor(
        readonly id: number,
        readonly device: {name: string, code: number},
        clusters: Cluster[],
    ) {
        clusters.forEach(cluster => this.clustersMap.set(cluster.id, cluster));
    }

    addDescriptorCluster(endpoints: Endpoint[]) {
        const descriptorCluster = new DescriptorCluster(this, endpoints);
        this.clustersMap.set(descriptorCluster.id, descriptorCluster);
    }

    getAttributeValue(clusterId?: number, attributeId?: number) {
        // If clusterId is not provided, iterate over all clusters
        var clusterIds = (clusterId === undefined) ? [...this.clustersMap.keys()] : [ clusterId ];

        return clusterIds.flatMap(clusterId => {
            const values = this.clustersMap.get(clusterId)?.getAttributeValue(attributeId);
            if (values === undefined) return [];
            return values.map(value => ({clusterId, ...value}));
        })
    }

    getClusterIds() {
        return [...this.clustersMap.keys()];
    }

    async invoke(session: Session, clusterId: number, commandId: number, args: Element) {
        return this.clustersMap.get(clusterId)?.invoke(session, commandId, args);
    }
}
