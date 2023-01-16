import { DescriptorCluster } from "../cluster/DescriptorCluster";
import { DeviceTypeId } from "../common/DeviceTypeId";
import { ClusterId } from "../common/ClusterId";
import { AttributeServer } from "../cluster/server/AttributeServer";
import { EndpointNumber } from "../common/EndpointNumber";
import { ClusterServer, Path, pathToId } from "./InteractionServer";
import { CommandServer } from "../cluster/server/CommandServer";

export class Endpoint {

    private readonly mainEndpointId: number;
    readonly endpoints = new Map<number, { deviceTypes: { name: string, code: number}[], clusters: Map<number, ClusterServer<any>> }>();
    readonly attributes = new Map<string, AttributeServer<any>>();
    readonly attributePaths = new Array<Path>();
    readonly commands = new Map<string, CommandServer<any, any>>();
    readonly commandPaths = new Array<Path>();

    constructor(endpointId: number, deviceTypes: { name: string, code: number }[], clusters: ClusterServer<any>[], childrenEndpoints?: Endpoint[]) {
        this.mainEndpointId = endpointId;
        return this.addEndpoint(endpointId, deviceTypes, clusters, childrenEndpoints);
    }

    addEndpoint(endpointId: number, deviceTypes: { name: string, code: number }[], clusters: ClusterServer<any>[], childrenEndpoints?: Endpoint[]) {
        // Add the descriptor cluster
        const descriptorCluster = new ClusterServer(DescriptorCluster, {}, {
            deviceTypeList: deviceTypes.map(deviceType => ({type: new DeviceTypeId(deviceType.code), revision: 1})),
            serverList: [],
            clientList: [],
            partsList: [],
        }, {});
        clusters.unshift(descriptorCluster);
        descriptorCluster.attributes.serverList.set(clusters.map(({id}) => new ClusterId(id)));

        const clusterMap = new Map<number, ClusterServer<any>>();
        clusters.forEach(cluster => {
            const {id: clusterId, attributes, commands} = cluster;
            clusterMap.set(clusterId, cluster);
            // Add attributes
            for (const name in attributes) {
                const attribute = attributes[name];
                const path = {endpointId, clusterId, id: attribute.id};
                this.attributes.set(pathToId(path), attribute);
                this.attributePaths.push(path);
            }

            // Add commands
            commands.forEach(command => {
                const path = {endpointId, clusterId, id: command.invokeId};
                this.commands.set(pathToId(path), command);
                this.commandPaths.push(path);
            });
        });

        this.endpoints.set(endpointId, {deviceTypes, clusters: clusterMap});

        const parentPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = this.attributes.get(pathToId({
            endpointId: this.mainEndpointId,
            clusterId: DescriptorCluster.id,
            id: DescriptorCluster.attributes.partsList.id
        }));

        if (parentPartsListAttribute === undefined) throw new Error(`Descriptor CLuster of endpoint ${this.mainEndpointId} not found.`);
        const newPartsList = parentPartsListAttribute.get();

        // Add all data from the child endpoints
        if (childrenEndpoints) {
            childrenEndpoints.forEach(children => {
                children.endpoints.forEach((endpointDetails, endpoint) => {
                    this.endpoints.set(endpoint, endpointDetails);
                });

                children.attributes.forEach((attributeDetails, attribute) => {
                    this.attributes.set(attribute, attributeDetails);
                });
                this.attributePaths.push(...children.attributePaths);

                children.commands.forEach((commandDetails, command) => {
                    this.commands.set(command, commandDetails);
                });
                this.commandPaths.push(...children.commandPaths);

                const childrenPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = this.attributes.get(pathToId({
                    endpointId: children.mainEndpointId,
                    clusterId: DescriptorCluster.id,
                    id: DescriptorCluster.attributes.partsList.id
                }));
                if (childrenPartsListAttribute === undefined) throw new Error(`Descriptor CLuster of endpoint ${children.mainEndpointId} not found.`);
                const childrenPartsList = childrenPartsListAttribute.get();
                if (children.mainEndpointId !== undefined) {
                    newPartsList.push(new EndpointNumber(children.mainEndpointId));
                }
                if (childrenPartsList.length > 0) {
                    newPartsList.push(...childrenPartsList);
                }
            });
        }

        // Add part list if the endpoint is not current main endpoint
        if (endpointId !== this.mainEndpointId) {
            newPartsList.push(new EndpointNumber(endpointId));
        }
        parentPartsListAttribute.set(newPartsList);

        return this;
    }
}
