/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Session } from "../../session/Session";
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

export class Device {
    private readonly endpointsMap = new Map<number, Endpoint>();
    
    constructor(endpoints: Endpoint[]) {
        endpoints.forEach(endpoint => this.endpointsMap.set(endpoint.id, endpoint));
    }

    getAttributeValues({endpointId, clusterId, attributeId}: AttributePath) {
        // If the endpoint is not provided, iterate over all endpoints
        var endpointIds = (endpointId === undefined) ? [...this.endpointsMap.keys()] : [ endpointId ];
        return endpointIds.flatMap(endpointId => {
            const values = this.endpointsMap.get(endpointId)?.getAttributeValue(clusterId, attributeId);
            if (values === undefined) return [];
            return values.map(({clusterId, attributeId, value, version}) => ({
                path: { endpointId, clusterId, attributeId },
                value, version
            }));
        })
    }

    async invoke(session: Session, commandPath: CommandPath, args: Element) {
        const {endpointId, clusterId, commandId} = commandPath;
        const result = await this.endpointsMap.get(endpointId)?.invoke(session, clusterId, commandId, args);
        if (result === undefined) return [];
        return [{ commandPath, result }];
    }
}
