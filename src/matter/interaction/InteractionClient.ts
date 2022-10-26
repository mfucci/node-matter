/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { MessageExchange } from "../common/MessageExchange";
import { MatterController } from "../MatterController";
import { capitalize } from "../../util/String";
import { Attribute, AttributeJsType, Attributes, Cluster, Command, Commands, NoResponseT, RequestType, ResponseType } from "../cluster/Cluster";
import { InteractionClientMessenger } from "./InteractionMessenger";
import { ResultCode } from "../cluster/server/CommandServer";
import { ClusterClient } from "../cluster/client/ClusterClient";

export function ClusterClient<CommandT extends Commands, AttributeT extends Attributes>(interactionClient: InteractionClient, endpointId: number, clusterDef: Cluster<CommandT, AttributeT>): ClusterClient<CommandT, AttributeT> {
    const result: any = {};
    const { id: clusterId, commands, attributes } = clusterDef;

    // Add accessors
    for (const attributeName in attributes) {
        const attribute = attributes[attributeName];
        const captilizedAttributeName = capitalize(attributeName);
        result[`get${captilizedAttributeName}`] = async () => interactionClient.get(endpointId, clusterId, attribute);
        result[`set${captilizedAttributeName}`] = async <T,>(value: T) => interactionClient.set<T>(endpointId, clusterId, attribute, value);
        result[`subscribe${captilizedAttributeName}`] = async () => interactionClient.subscribe(endpointId, clusterId, attribute);
    }

    // Add command calls
    for (const commandName in commands) {
        const { requestId, requestTemplate, responseId, responseTemplate, optional } = commands[commandName];
        result[commandName] = async <RequestT, ResponseT>(request: RequestT) => interactionClient.invoke<Command<RequestT, ResponseT>>(endpointId, clusterId, request, requestId, requestTemplate, responseId, responseTemplate, optional);
    }

    return result as ClusterClient<CommandT, AttributeT>;
}

export class InteractionClient {
    constructor(
        private readonly exchangeProvider: () => MessageExchange<MatterController>,
    ) {}

    async get<A extends Attribute<any>>(endpointId: number, clusterId: number, { id, template, optional, conformanceValue }: A): Promise<AttributeJsType<A>> {
        return this.withMessenger<AttributeJsType<A>>(async messenger => {
            const response = await messenger.sendReadRequest({
                attributes: [ {endpointId , clusterId, id} ],
                interactionModelRevision: 1,
                isFabricFiltered: true,
            });

            const value = response.values.map(({value}) => value).find(({ path }) => endpointId === path.endpointId && clusterId === path.clusterId && id === path.id);
            if (value === undefined) {
                if (optional) return undefined;
                if (conformanceValue === undefined) throw new Error(`Attribute ${endpointId}/${clusterId}/${id} not found`);
                return conformanceValue;
            }
            return TlvObjectCodec.decodeElement(value.value, template);
        });
    }

    async set<T>(endpointId: number, clusterId: number, { id, template, conformanceValue }: Attribute<T>, value: T): Promise<void> {
        throw new Error("not implemented");
    }

    async subscribe(endpointId: number, clusterId: number, { id, template, conformanceValue }: Attribute<any>): Promise<void> {
        throw new Error("not implemented");
    }

    async invoke<C extends Command<any, any>>(endpointId: number, clusterId: number, request: RequestType<C>, id: number, requestTemplate: Template<RequestType<C>>, responseId: number, responseTemplate: Template<ResponseType<C>>, optional: boolean): Promise<ResponseType<C>> {
        return this.withMessenger<ResponseType<C>>(async messenger => {
            const { responses } = await messenger.sendInvokeCommand({
                invokes: [
                    { path: { endpointId, clusterId, id }, args: TlvObjectCodec.encodeElement(request, requestTemplate) }
                ],
                timedRequest: false,
                suppressResponse: false,
            });
            if (responses.length === 0) throw new Error("No response received");
            const { response, result } = responses[0];
            if (result !== undefined) {
                const resultCode = result.result.code;
                if (resultCode !== ResultCode.Success) throw new Error(`Received non-success result: ${resultCode}`);
                if (responseTemplate !== NoResponseT) throw new Error("A response was expected for this command");
                return undefined as unknown as ResponseType<C>; // ResponseType is void, force casting the empty result
            } if (response !== undefined) {
                return TlvObjectCodec.decodeElement(response.response, responseTemplate);
            } if (optional) {
                return undefined as ResponseType<C>; // ResponseType allows undefined for optional commands
            }
            throw new Error("Received invoke response with no result nor response");
        });
    }

    private async withMessenger<T>(invoke: (messenger: InteractionClientMessenger) => Promise<T>): Promise<T> {
        const messenger = new InteractionClientMessenger(this.exchangeProvider());
        try {
            return await invoke(messenger);
        } finally {
            messenger.close();
        }
    }
}
