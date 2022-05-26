import { Element } from "../codec/TlvCodec";
import { AttributePath, CommandPath } from "../interaction/InteractionMessages";
import { Endpoint } from "./Endpoint";

export class Device {
    private readonly endpoints = new Map<number, Endpoint>();
    
    constructor(endpoints: Endpoint[]) {
        endpoints.forEach(endpoint => this.endpoints.set(endpoint.id, endpoint));
    }

    getAttributeValues({endpointId, clusterId, attributeId}: AttributePath) {
        var endpointIds = (endpointId === undefined) ? [...this.endpoints.keys()] : [endpointId];
        return endpointIds.flatMap(endpointId => {
            const path = { endpointId, clusterId, attributeId };
            const valueVersion = this.endpoints.get(endpointId)?.getAttributeValue(clusterId, attributeId);
            if (valueVersion === undefined) return [];
            const { value, version } = valueVersion;
            return [{value, path, version}];
        })
    }

    invoke(path: CommandPath, args: Element) {
        const {endpointId, clusterId, commandId} = path;
        const response = this.endpoints.get(endpointId)?.invoke(clusterId, commandId, args);
        if (response === undefined) return [];
        return [{path, response}];
    }
}
