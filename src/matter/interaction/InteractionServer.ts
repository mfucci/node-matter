/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { ProtocolHandler } from "../common/ProtocolHandler";
import { Channel } from "../../net/Channel";
import { MessageExchange } from "../common/MessageExchange";
import { InteractionServerMessenger, InvokeRequest, InvokeResponse, ReadRequest, DataReport, SubscribeRequest, SubscribeResponse } from "./InteractionMessenger";
import { Session } from "../session/Session";
import { Command, ResultCode } from "../cluster/server/Command";
import { DescriptorClusterSpec } from "../cluster/DescriptorCluster";
import { TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Element } from "../../codec/TlvCodec";
import { Attribute } from "../cluster/server/Attribute";
import { ClusterSpec } from "../cluster/ClusterSpec";
import { Attributes, AttributeValues, ClusterServerHandlers } from "../cluster/server/ClusterServer";
import { SecureSession } from "../session/SecureSession";
import { SubscriptionHandler } from "./SubscriptionHandler";

export const INTERACTION_PROTOCOL_ID = 0x0001;

export class ClusterServer<ClusterT extends ClusterSpec<any, any>> {
    readonly id: number;
    readonly attributes = <Attributes<ClusterT["attributes"]>>{};
    readonly commands = new Array<Command<any, any>>();

    constructor(clusterDef: ClusterT, attributesValues: AttributeValues<ClusterT["attributes"]>, handlers: ClusterServerHandlers<ClusterT>) {
        const { id, attributes: attributeDefs, commands: commandDefs } = clusterDef;
        this.id = id;

        // Create attributes
        for (const name in attributeDefs) {
            const { id, template } = attributeDefs[name];
            this.attributes[name as (keyof ClusterT["attributes"])] = new Attribute(id, name, template, attributesValues[name]);
        }

        // Create commands
        for (const name in commandDefs) {
            const { requestId, requestTemplate, responseId, responseTemplate } = commandDefs[name];
            this.commands.push(new Command(requestId, responseId, name, requestTemplate, responseTemplate, (request, session) => handlers[name]({request, attributes: this.attributes, session})));
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
    attribute: Attribute<any>,
}

function pathToId({endpointId, clusterId, id}: Path) {
    return `${endpointId}/${clusterId}/${id}`;
}

export class InteractionServer implements ProtocolHandler<MatterDevice> {
    private readonly attributes = new Map<string, Attribute<any>>();
    private readonly attributePaths = new Array<Path>();
    private readonly commands = new Map<string, Command<any, any>>();
    private readonly commandPaths = new Array<Path>();

    constructor() {}

    getId() {
        return INTERACTION_PROTOCOL_ID;
    }

    addEndpoint(endpointId: number, device: {name: string, code: number}, clusters: ClusterServer<any>[]) {
        // Add the descriptor cluster
        const descriptorCluster = new ClusterServer(DescriptorClusterSpec, {
            deviceList: [{revision: 1, type: device.code}],
            serverList: [],
            clientList: [],
            partsList: [],
        }, {});
        clusters.push(descriptorCluster);
        descriptorCluster.attributes.serverList.set(clusters.map(({id}) => id));

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
            const rootPartsListAttribute = this.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorClusterSpec.id, id: DescriptorClusterSpec.attributes.partsList.id}));
            if (rootPartsListAttribute === undefined) throw new Error("The root endpoint should be added first!");
            rootPartsListAttribute.set([...rootPartsListAttribute.get(), endpointId]);
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
        console.log(`Received read request from ${exchange.channel.getName()}: ${attributePaths.map(({endpointId = "*", clusterId = "*", id = "*"}) => `${endpointId}/${clusterId}/${id}`).join(", ")}`);

        const values = this.getAttributes(attributePaths)
            .map(({ path, attribute }) => {
                const { value, version } = attribute.getWithVersion();
                return { path, value, version, template: attribute.template };
            });

        return {
            isFabricFiltered: true,
            interactionModelRevision: 1,
            values: values.map(({ path, value, version, template }) => ({
                value: {
                    path,
                    version,
                    value: TlvObjectCodec.encodeElement(value, template),
                },
            })),
        };
    }

    handleSubscribeRequest(exchange: MessageExchange<MatterDevice>, { minIntervalFloorSeconds, maxIntervalCeilingSeconds, attributeRequests, keepSubscriptions }: SubscribeRequest): SubscribeResponse | undefined {
        console.log(`Received subscribe request from ${exchange.channel.getName()}`);

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

            return {
                subscriptionId: session.addSubscription(SubscriptionHandler.Builder(session.getContext(), fabric, session.getPeerNodeId(), attributes)),
                maxIntervalCeilingSeconds,
                interactionModelRevision: 1,
            };
        }
    }

    async handleInvokeRequest(exchange: MessageExchange<MatterDevice>, {invokes}: InvokeRequest): Promise<InvokeResponse> {
        console.log(`Received invoke request from ${exchange.channel.getName()}: ${invokes.map(({path: {endpointId, clusterId, id}}) => `${endpointId}/${clusterId}/${id}`).join(", ")}`);

        const results = new Array<{path: Path, code: ResultCode, response?: Element, responseId: number }>();

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
                if (response === undefined) {
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
                    .forEach(path => result.push({ path, attribute: this.attributes.get(pathToId(path)) as Attribute<any> }));
            }
        })

        return result;
    }
}
