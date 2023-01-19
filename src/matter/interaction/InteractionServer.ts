/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { ProtocolHandler } from "../common/ProtocolHandler";
import { MessageExchange } from "../common/MessageExchange";
import { InteractionServerMessenger, InvokeRequest, InvokeResponse, ReadRequest, DataReport, SubscribeRequest, SubscribeResponse, TimedRequest, WriteRequest, WriteResponse } from "./InteractionMessenger";
import { CommandServer, ResultCode } from "../cluster/server/CommandServer";
import { DescriptorCluster } from "../cluster/DescriptorCluster";
import { AttributeGetterServer, AttributeServer } from "../cluster/server/AttributeServer";
import { Cluster } from "../cluster/Cluster";
import { AttributeServers, AttributeInitialValues, ClusterServerHandlers } from "../cluster/server/ClusterServer";
import { SecureSession } from "../session/SecureSession";
import { SubscriptionHandler } from "./SubscriptionHandler";
import { Logger } from "../../log/Logger";
import { DeviceTypeId } from "../common/DeviceTypeId";
import { ClusterId } from "../common/ClusterId";
import { TlvStream, TypeFromBitSchema } from "@project-chip/matter.js";
import { EndpointNumber } from "../common/EndpointNumber";
import { capitalize } from "../../util/String";
import { StatusCode } from "./InteractionMessages";

export const INTERACTION_PROTOCOL_ID = 0x0001;

export class ClusterServer<ClusterT extends Cluster<any, any, any, any>> {
    readonly id: number;
    readonly name: string;
    readonly attributes = <AttributeServers<ClusterT["attributes"]>>{};
    readonly commands = new Array<CommandServer<any, any>>();

    constructor(clusterDef: ClusterT, features: TypeFromBitSchema<ClusterT["features"]>, attributesInitialValues: AttributeInitialValues<ClusterT["attributes"]>, handlers: ClusterServerHandlers<ClusterT>) {
        const { id, name, attributes: attributeDefs, commands: commandDefs } = clusterDef;
        this.id = id;
        this.name = name;

        // Create attributes
        attributesInitialValues = {
            ...attributesInitialValues,
            clusterRevision: clusterDef.revision,
            featureMap: features,
        };
        for (const name in attributesInitialValues) {
            let { id, schema, writable } = attributeDefs[name];
            const validator = typeof schema.validate === 'function' ? schema.validate.bind(schema) : undefined;
            const getter = (handlers as any)[`get${capitalize(name)}`];
            if (getter === undefined) {
                (this.attributes as any)[name] = new AttributeServer(id, name, schema, validator ?? (() => {}), writable, (attributesInitialValues as any)[name]);
            } else {
                (this.attributes as any)[name] = new AttributeGetterServer(id, name, schema, validator ?? (() => {}), writable, (attributesInitialValues as any)[name], getter);
            }
        }

        // Create commands
        for (const name in commandDefs) {
            const handler = (handlers as any)[name];
            if (handler === undefined) continue;
            const { requestId, requestSchema, responseId, responseSchema } = commandDefs[name];
            this.commands.push(new CommandServer(requestId, responseId, name, requestSchema, responseSchema, (request, session) => handler({request, attributes: this.attributes, session})));
        }
    }
}

export interface CommandPath {
    endpointId: number,
    clusterId: number,
    commandId: number,
}

export interface AttributePath {
    endpointId: number,
    clusterId: number,
    attributeId: number,
}

export interface AttributeWithPath {
    path: AttributePath,
    attribute: AttributeServer<any>,
}

export function commandPathToId({endpointId, clusterId, commandId}: CommandPath) {
    return `${endpointId}/${clusterId}/${commandId}`;
}

export function attributePathToId({endpointId, clusterId, attributeId}: Partial<AttributePath>) {
    return `${endpointId}/${clusterId}/${attributeId}`;
}

function toHex(value: number | undefined) {
    return value === undefined ? "*" : `0x${value.toString(16)}`;
}

const logger = Logger.get("InteractionProtocol");

export class InteractionServer implements ProtocolHandler<MatterDevice> {
    private readonly endpoints = new Map<number, { name: string, code: number, clusters: Map<number, ClusterServer<any>> }>();
    private readonly attributes = new Map<string, AttributeServer<any>>();
    private readonly attributePaths = new Array<AttributePath>();
    private readonly commands = new Map<string, CommandServer<any, any>>();
    private readonly commandPaths = new Array<CommandPath>();

    constructor() {}

    getId() {
        return INTERACTION_PROTOCOL_ID;
    }

    addEndpoint(endpointId: number, device: {name: string, code: number}, clusters: ClusterServer<any>[]) {
        // Add the descriptor cluster
        const descriptorCluster = new ClusterServer(DescriptorCluster, {}, {
            deviceTypeList: [{revision: 1, type: new DeviceTypeId(device.code)}],
            serverList: [],
            clientList: [],
            partsList: [],
        }, {});
        clusters.push(descriptorCluster);
        descriptorCluster.attributes.serverList.setLocal(clusters.map(({id}) => new ClusterId(id)));

        const clusterMap = new Map<number, ClusterServer<any>>();
        clusters.forEach(cluster => {
            const { id: clusterId, attributes, commands } = cluster;
            clusterMap.set(clusterId, cluster);
            // Add attributes
            for (const name in attributes) {
                const attribute = attributes[name];
                const path = { endpointId, clusterId, attributeId: attribute.id };
                this.attributes.set(attributePathToId(path), attribute);
                this.attributePaths.push(path);
            }

            // Add commands
            commands.forEach(command => {
                const path = { endpointId, clusterId, commandId: command.invokeId };
                this.commands.set(commandPathToId(path), command);
                this.commandPaths.push(path);
            });
        });

        // Add part list if the endpoint is not root
        if (endpointId !== 0) {
            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = this.attributes.get(attributePathToId({endpointId: 0, clusterId: DescriptorCluster.id, attributeId: DescriptorCluster.attributes.partsList.id}));
            if (rootPartsListAttribute === undefined) throw new Error("The root endpoint should be added first!");
            rootPartsListAttribute.setLocal([...rootPartsListAttribute.getLocal(), new EndpointNumber(endpointId)]);
        }

        this.endpoints.set(endpointId, { ...device, clusters: clusterMap });

        return this;
    }

    async onNewExchange(exchange: MessageExchange<MatterDevice>) {
        await new InteractionServerMessenger(exchange).handleRequest(
            readRequest => this.handleReadRequest(exchange, readRequest),
            subscribeRequest => this.handleSubscribeRequest(exchange, subscribeRequest),
            invokeRequest => this.handleInvokeRequest(exchange, invokeRequest),
            timedRequest => this.handleTimedRequest(exchange, timedRequest),
            writeRequest => this.handleWriteRequest(exchange, writeRequest),
        );
    }

    handleReadRequest(exchange: MessageExchange<MatterDevice>, {attributes: attributePaths, isFabricFiltered}: ReadRequest): DataReport {
        logger.debug(`Received read request from ${exchange.channel.getName()}: ${attributePaths.map(path => this.resolveAttributeName(path)).join(", ")}, isFabricFiltered=${isFabricFiltered}`);

        const values = this.getAttributes(attributePaths)
            .map(({ path, attribute }) => {
                const { value, version } = attribute.getWithVersion(exchange.session);
                return { path, value, version, schema: attribute.schema };
            });

        logger.debug(`Read request from ${exchange.channel.getName()} resolved to: ${values.map(({ path, value, version }) => `${this.resolveAttributeName(path)}=${Logger.toJSON(value)} (${version})`).join(", ")}`);
        return {
            interactionModelRevision: 1,
            values: values.map(({ path, value, version, schema }) => ({
                value: {
                    path,
                    version,
                    value: schema.encodeTlv(value),
                },
            })),
        };
    }

    handleWriteRequest(exchange: MessageExchange<MatterDevice>, {suppressResponse, writeRequests }: WriteRequest): WriteResponse | undefined {
        logger.debug(`Received write request from ${exchange.channel.getName()} for ${writeRequests.length} attributes, suppressResponse=${suppressResponse}`);

        // TODO consider TimedRequest constrains

        const writeResponses = [];
        for (const request of writeRequests) {
            const attribute = this.getAttribute({ endpointId: request.path.endpointId, clusterId: request.path.clusterId, id: request.path.attributeId});
            if (attribute.length === 1) {
                const data = attribute[0].attribute.schema.decodeTlv(request.data);
                logger.debug(`Handle write request from ${exchange.channel.getName()} resolved to: ${this.resolveAttributeName(attribute[0].path)}=${Logger.toJSON(data)} (${request.dataVersion})`);
                // TODO add checks or dataVersion
                attribute[0].attribute.set(data, exchange.session);
            } else if (attribute.length === 0) {
                logger.error(`Attribute ${this.resolveAttributeName({ endpointId: request.path.endpointId, clusterId: request.path.clusterId, id: request.path.attributeId })} not found`);
                writeResponses.push({
                    status: {
                        status: StatusCode.UnsupportedWrite
                    }, // TODO: Find correct status code
                    path: request.path,
                });
            } else {
                logger.error(`Attribute ${this.resolveAttributeName({ endpointId: request.path.endpointId, clusterId: request.path.clusterId, id: request.path.attributeId })} is ambiguous`);
                attribute.forEach(({ path }) => {
                    logger.debug(`Skipped set ${exchange.channel.getName()} to: ${this.resolveAttributeName(path)}=${Logger.toJSON(request.data)} (${request.dataVersion})`);
                });
                writeResponses.push({
                    status: {
                        status: StatusCode.UnsupportedWrite
                    },
                    path: request.path,
                });
            }
        }

        // TODO respect suppressResponse

        logger.debug(`Write request from ${exchange.channel.getName()} resolved to: ${writeResponses.map(({ path, status }) => `${this.resolveAttributeName(path)}=${Logger.toJSON(status)}`).join(", ")}`);
        return {
            interactionModelRevision: 1,
            writeResponses
        };
    }

    handleSubscribeRequest(exchange: MessageExchange<MatterDevice>, { minIntervalFloorSeconds, maxIntervalCeilingSeconds, attributeRequests, keepSubscriptions }: SubscribeRequest): SubscribeResponse | undefined {
        logger.debug(`Received subscribe request from ${exchange.channel.getName()}`);

        if (!exchange.session.isSecure()) throw new Error("Subscriptions are only implemented on secure sessions");
        const session = exchange.session as SecureSession<MatterDevice>;
        const fabric = session.getFabric();
        if (fabric === undefined) throw new Error("Subscriptions are only implemented after a fabric has been assigned");

        if (!keepSubscriptions) {
            session.clearSubscriptions();
        }

        if (attributeRequests !== undefined) {
            logger.debug(`Subscribe to ${attributeRequests.map(path => this.resolveAttributeName(path)).join(", ")}`);
            let attributes = this.getAttributes(attributeRequests);

            if (attributeRequests.length === 0) throw new Error("Invalid subscription request");
            if (minIntervalFloorSeconds < 0) throw new Error("minIntervalFloorSeconds should be greater or equal to 0");
            if (maxIntervalCeilingSeconds < 0) throw new Error("maxIntervalCeilingSeconds should be greater or equal to 1");
            if (maxIntervalCeilingSeconds < minIntervalFloorSeconds) throw new Error("maxIntervalCeilingSeconds should be greater or equal to minIntervalFloorSeconds");

            const subscriptionId = session.addSubscription(SubscriptionHandler.Builder(session.getContext(), fabric, session.getPeerNodeId(), attributes, minIntervalFloorSeconds, maxIntervalCeilingSeconds));

            return { subscriptionId, maxIntervalCeilingSeconds, interactionModelRevision: 1 };
        }
    }

    async handleInvokeRequest(exchange: MessageExchange<MatterDevice>, {invokes}: InvokeRequest): Promise<InvokeResponse> {
        logger.debug(`Received invoke request from ${exchange.channel.getName()}: ${invokes.map(({ path: {endpointId, clusterId, commandId }}) => `${toHex(endpointId)}/${toHex(clusterId)}/${toHex(commandId)}`).join(", ")}`);

        const results = new Array<{path: CommandPath, code: ResultCode, response: TlvStream, responseId: number }>();

        await Promise.all(invokes.map(async ({ path, args }) => {
            const command = this.commands.get(commandPathToId(path));
            if (command === undefined) return;
            const result = await command.invoke(exchange.session, args);
            results.push({ ...result, path });
        }));

        return {
            suppressResponse: false,
            interactionModelRevision: 1,
            responses: results.map(({path, responseId, code, response}) => {
                if (response.length === 0) {
                    return { result: { path, result: { code }} };
                } else {
                    return { response: { path: { ...path, commandId: responseId }, response} };
                }
            }),
        };
    }

    async handleTimedRequest(exchange: MessageExchange<MatterDevice>, {timeout}: TimedRequest) {
        logger.debug(`Received timed request (${timeout}) from ${exchange.channel.getName()}`);
        // TODO: implement this
    }

    private resolveAttributeName({ endpointId, clusterId, attributeId }: Partial<AttributePath>) {
        if (endpointId === undefined) {
            return `*/${toHex(clusterId)}/${toHex(attributeId)}`;
        }
        const endpoint = this.endpoints.get(endpointId);
        if (endpoint === undefined) {
            return `unknown(${toHex(endpointId)})/${toHex(clusterId)}/${toHex(attributeId)}`;
        }
        const endpointName = `${endpoint.name}(${toHex(endpointId)})`;

        if (clusterId === undefined) {
            return `${endpointName}/*/${toHex(attributeId)}`;
        }
        const cluster = endpoint.clusters.get(clusterId);
        if (cluster === undefined) {
            return `${endpointName}/unknown(${toHex(clusterId)})/${toHex(attributeId)}`;
        }
        const clusterName = `${cluster.name}(${toHex(clusterId)})`;

        if (attributeId === undefined) {
            return `${endpointName}/${clusterName}/*`;
        }
        const attribute = this.attributes.get(attributePathToId({ endpointId, clusterId, attributeId }));
        const attributeName = `${attribute?.name ?? "unknown"}(${toHex(attributeId)})`;
        return `${endpointName}/${clusterName}/${attributeName}`;
    }

    private getAttributes(filters: Partial<AttributePath>[], onlyWritable: boolean = false): AttributeWithPath[] {
        const result = new Array<AttributeWithPath>();
        const { endpointId, clusterId, id } = path;

        filters.forEach(({ endpointId, clusterId, attributeId }) => {
            if (endpointId !== undefined && clusterId !== undefined && attributeId !== undefined) {
                const path = { endpointId, clusterId, attributeId };
                const attribute = this.attributes.get(attributePathToId(path));
                if (attribute === undefined) return;
                if (onlyWritable && !attribute.isWritable) return;
                result.push({ path, attribute });
            } else {
                this.attributePaths.filter(path =>
                    (endpointId === undefined || endpointId === path.endpointId)
                    && (clusterId === undefined || clusterId === path.clusterId)
                    && (attributeId === undefined || attributeId === path.attributeId))
                    .forEach(path => {
                        const attribute = this.attributes.get(attributePathToId(path)) as AttributeServer<any>;
                        if (attribute === undefined) return;
                        if (onlyWritable && !attribute.isWritable) return;
                        result.push({ path, attribute })
                    });
            }
        });

        return result;
    }
}
