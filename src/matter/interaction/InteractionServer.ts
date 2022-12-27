/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { ProtocolHandler } from "../common/ProtocolHandler";
import { MessageExchange } from "../common/MessageExchange";
import { InteractionServerMessenger, InvokeRequest, InvokeResponse, ReadRequest, DataReport, SubscribeRequest, SubscribeResponse } from "./InteractionMessenger";
import { CommandServer, ResultCode } from "../cluster/server/CommandServer";
import { DescriptorCluster } from "../cluster/DescriptorCluster";
import { AttributeServer } from "../cluster/server/AttributeServer";
import { Cluster } from "../cluster/Cluster";
import { AttributeServers, AttributeInitialValues, ClusterServerHandlers } from "../cluster/server/ClusterServer";
import { SecureSession } from "../session/SecureSession";
import { SubscriptionHandler } from "./SubscriptionHandler";
import { Logger } from "../../log/Logger";
import { DeviceTypeId } from "../common/DeviceTypeId";
import { ClusterId } from "../common/ClusterId";
import { TlvStream, TypeFromBitSchema } from "@project-chip/matter.js";
import { EndpointNumber } from "../common/EndpointNumber";

export const INTERACTION_PROTOCOL_ID = 0x0001;

export class ClusterServer<ClusterT extends Cluster<any, any, any, any>> {
    readonly id: number;
    readonly attributes = <AttributeServers<ClusterT["attributes"]>>{};
    readonly commands = new Array<CommandServer<any, any>>();

    constructor(clusterDef: ClusterT, features: TypeFromBitSchema<ClusterT["features"]>, attributesInitialValues: AttributeInitialValues<ClusterT["attributes"]>, handlers: ClusterServerHandlers<ClusterT>) {
        const { id, attributes: attributeDefs, commands: commandDefs } = clusterDef;
        this.id = id;

        // Create attributes
        attributesInitialValues = {
            ...attributesInitialValues,
            clusterRevision: clusterDef.revision,
            featureMap: features,
        };
        for (const name in attributesInitialValues) {
            const { id, schema, validator } = attributeDefs[name];
            (this.attributes as any)[name] = new AttributeServer(id, name, schema, validator ?? (() => {}), (attributesInitialValues as any)[name]);
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

export interface Path {
    endpointId: number,
    clusterId: number,
    id: number,
}

export interface AttributeWithPath {
    path: Path,
    attribute: AttributeServer<any>,
}

export function pathToId({endpointId, clusterId, id}: Path) {
    return `${endpointId}/${clusterId}/${id}`;
}

const logger = Logger.get("InteractionProtocol");

export class InteractionServer implements ProtocolHandler<MatterDevice> {
    private readonly attributes = new Map<string, AttributeServer<any>>();
    private readonly attributePaths = new Array<Path>();
    private readonly commands = new Map<string, CommandServer<any, any>>();
    private readonly commandPaths = new Array<Path>();

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
        descriptorCluster.attributes.serverList.set(clusters.map(({id}) => new ClusterId(id)));

        clusters.forEach(({ id: clusterId, attributes, commands }) => {
            // Add attributes
            for (const name in attributes) {
                const attribute = attributes[name];
                const path = { endpointId, clusterId, id: attribute.id };
                this.attributes.set(pathToId(path), attribute);
                this.attributePaths.push(path);
            }

            // Add commands
            commands.forEach(command => {
                const path = { endpointId, clusterId, id: command.invokeId };
                this.commands.set(pathToId(path), command);
                this.commandPaths.push(path);
            });
        });

        // Add part list if the endpoint is not root
        if (endpointId !== 0) {
            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = this.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            if (rootPartsListAttribute === undefined) throw new Error("The root endpoint should be added first!");
            rootPartsListAttribute.set([...rootPartsListAttribute.get(), new EndpointNumber(endpointId)]);
        }

        return this;
    }

    async onNewExchange(exchange: MessageExchange<MatterDevice>) {
        await new InteractionServerMessenger(exchange).handleRequest(
            readRequest => this.handleReadRequest(exchange, readRequest),
            subscribeRequest => this.handleSubscribeRequest(exchange, subscribeRequest),
            invokeRequest => this.handleInvokeRequest(exchange, invokeRequest),
        );
    }

    handleReadRequest(exchange: MessageExchange<MatterDevice>, {attributes: attributePaths}: ReadRequest): DataReport {
        logger.debug(`Received read request from ${exchange.channel.getName()}: ${attributePaths.map(({endpointId = "*", clusterId = "*", id = "*"}) => `${endpointId}/${clusterId}/${id}`).join(", ")}`);

        const values = this.getAttributes(attributePaths)
            .map(({ path, attribute }) => {
                const { value, version } = attribute.getWithVersion();
                return { path, value, version, schema: attribute.schema };
            });

        return {
            isFabricFiltered: true,
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
            const attributes = this.getAttributes(attributeRequests);

            if (attributeRequests.length === 0) throw new Error("Invalid subscription request");
            if (minIntervalFloorSeconds < 0) throw new Error("minIntervalFloorSeconds should be greater or equal to 0");
            if (maxIntervalCeilingSeconds < 0) throw new Error("maxIntervalCeilingSeconds should be greater or equal to 1");
            if (maxIntervalCeilingSeconds < minIntervalFloorSeconds) throw new Error("maxIntervalCeilingSeconds should be greater or equal to minIntervalFloorSeconds");

            const subscriptionId = session.addSubscription(SubscriptionHandler.Builder(session.getContext(), fabric, session.getPeerNodeId(), attributes, minIntervalFloorSeconds, maxIntervalCeilingSeconds));

            return { subscriptionId, maxIntervalCeilingSeconds, interactionModelRevision: 1 };
        }
    }

    async handleInvokeRequest(exchange: MessageExchange<MatterDevice>, {invokes}: InvokeRequest): Promise<InvokeResponse> {
        logger.debug(`Received invoke request from ${exchange.channel.getName()}: ${invokes.map(({path: {endpointId, clusterId, id}}) => `${endpointId}/${clusterId}/${id}`).join(", ")}`);

        const results = new Array<{path: Path, code: ResultCode, response: TlvStream, responseId: number }>();

        await Promise.all(invokes.map(async ({ path, args }) => {
            const command = this.commands.get(pathToId(path));
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
                    return { response: { path: { ...path, id: responseId }, response} };
                }
            }),
        };
    }

    private getAttributes(filters: Partial<Path>[] ): AttributeWithPath[] {
        const result = new Array<AttributeWithPath>();

        filters.forEach(({ endpointId, clusterId, id }) => {
            if (endpointId !== undefined && clusterId !== undefined && id !== undefined) {
                const path = { endpointId, clusterId, id };
                const attribute = this.attributes.get(pathToId(path));
                if (attribute === undefined) return;
                result.push({ path, attribute });
            } else {
                this.attributePaths.filter(path =>
                    (endpointId === undefined || endpointId === path.endpointId)
                    && (clusterId === undefined || clusterId === path.clusterId)
                    && (id === undefined || id === path.id))
                    .forEach(path => result.push({ path, attribute: this.attributes.get(pathToId(path)) as AttributeServer<any> }));
            }
        })

        return result;
    }
}
