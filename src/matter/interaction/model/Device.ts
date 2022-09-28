/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../../codec/TlvCodec";
import { Session } from "../../session/Session";
import { Attribute } from "./Attribute";
import { Endpoint } from "./Endpoint";

interface AttributePath {
    endpointId?: number,
    clusterId?: number,
    attributeId?: number,
}

interface CommandPath {
    endpointId: number,
    clusterId: number,
    commandId: number,
}

export class Device<ContextT> {
    private readonly endpointsMap = new Map<number, Endpoint<ContextT>>();
    
    constructor(endpoints: Endpoint<ContextT>[]) {
        endpoints.forEach(endpoint => {
            endpoint.addDescriptorCluster(endpoints);
            this.endpointsMap.set(endpoint.id, endpoint);
        });
    }

    getAttributes({endpointId, clusterId, attributeId}: AttributePath): Attribute<any>[] {
        if (endpointId === undefined) {
            // If the endpoint is not provided, iterate over all endpoints
            return [...this.endpointsMap.values()].flatMap(endpoint => endpoint.getAttributes(clusterId, attributeId));
        }

        const endpoint = this.endpointsMap.get(endpointId);
        if (endpoint === undefined) return [];
        return endpoint.getAttributes(clusterId, attributeId);
    }

    async invoke(session: Session<ContextT>, commandPath: CommandPath, args: Element) {
        const {endpointId, clusterId, commandId} = commandPath;
        const result = await this.endpointsMap.get(endpointId)?.invoke(session, clusterId, commandId, args);
        if (result === undefined) return [];
        return [{ commandPath, result }];
    }
}
