/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Device } from "./model/Device";
import { MessageExchange, ProtocolHandler } from "../server/MatterServer";
import { InteractionMessenger, InvokeRequest, InvokeResponse, ReadRequest, ReadResponse } from "./InteractionMessenger";

export class InteractionProtocol implements ProtocolHandler {
    constructor(
        private readonly device: Device,
    ) {}

    async onNewExchange(exchange: MessageExchange) {
        const messenger = new InteractionMessenger(
            exchange,
            readRequest => this.handleReadRequest(exchange, readRequest),
            invokeRequest => this.handleInvokeRequest(exchange, invokeRequest),
        );
        await messenger.handleRequest();
    }

    handleReadRequest(exchange: MessageExchange, {attributes}: ReadRequest): ReadResponse {
        console.log(`Received read request from ${exchange.getChannel().getName()}: ${attributes.map(({endpointId = "*", clusterId, attributeId}) => `${endpointId}/${clusterId}/${attributeId}`).join(", ")}`);

        return {
            isFabricFiltered: true,
            interactionModelRevision: 1,
            values: attributes.flatMap(path => this.device.getAttributeValues(path)).map(value => ({value})),
        };
    }

    async handleInvokeRequest(exchange: MessageExchange, {invokes}: InvokeRequest): Promise<InvokeResponse> {
        console.log(`Received invoke request from ${exchange.getChannel().getName()}: ${invokes.map(({path: {endpointId, clusterId, commandId}}) => `${endpointId}/${clusterId}/${commandId}`).join(", ")}`);

        const results = (await Promise.all(invokes.map(({path, args}) => this.device.invoke(exchange.getSession(), path, args)))).flat();
        return {
            suppressResponse: false,
            interactionModelRevision: 1,
            responses: results.map(({commandPath: {endpointId, clusterId, commandId}, result: {responseId, result, response}}) => {
                if (response === undefined) {
                    return { result: { path: {endpointId, clusterId, commandId}, result: { code: result}} };
                } else {
                    return { response: { path: {endpointId, clusterId, responseId}, response} };
                }
            }),
        };
    }
}
