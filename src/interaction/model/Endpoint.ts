/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Session } from "../../session/Session";
import { Cluster } from "./Cluster";

export class Endpoint {
    private readonly clusters = new Map<number, Cluster>();

    constructor(
        readonly id: number,
        readonly name: string,
        clusters: Cluster[],
    ) {
        clusters.forEach(cluster => this.clusters.set(cluster.id, cluster));
    }

    getAttributeValue(clusterId: number, attributeId: number) {
        return this.clusters.get(clusterId)?.getAttributeValue(attributeId);
    }

    async invoke(session: Session, clusterId: number, commandId: number, args: Element) {
        return this.clusters.get(clusterId)?.invoke(session, commandId, args);
    }
}
