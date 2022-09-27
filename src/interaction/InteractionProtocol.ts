/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Device } from "./model/Device";
import { ExchangeSocket, MatterServer, Protocol, ProtocolHandler } from "../server/MatterServer";
import { MessageExchange } from "../server/MessageExchange";
import { InteractionMessenger, InvokeRequest, InvokeResponse, ReadRequest, DataReport, SubscribeRequest, SubscribeResponse } from "./InteractionMessenger";
import { SecureSession } from "../session/SecureSession";
import { Attribute, Report } from "./model/Attribute";
import { Session } from "../session/Session";

export class InteractionProtocol implements ProtocolHandler {
    constructor(
        private readonly device: Device,
    ) {}

    async onNewExchange(exchange: MessageExchange) {
        await new InteractionMessenger(exchange).handleRequest(
            readRequest => this.handleReadRequest(exchange, readRequest),
            subscribeRequest => this.handleSubscribeRequest(exchange, subscribeRequest),
            invokeRequest => this.handleInvokeRequest(exchange, invokeRequest),
        );
    }

    handleReadRequest(exchange: MessageExchange, {attributes: attributePaths}: ReadRequest): DataReport {
        console.log(`Received read request from ${exchange.channel.getName()}: ${attributePaths.map(({endpointId = "*", clusterId = "*", attributeId = "*"}) => `${endpointId}/${clusterId}/${attributeId}`).join(", ")}`);

        return {
            isFabricFiltered: true,
            interactionModelRevision: 1,
            values: attributePaths.flatMap(path => this.device.getAttributes(path)).map(attribute => ({ value: attribute.getValue() })),
        };
    }

    handleSubscribeRequest(exchange: MessageExchange, { minIntervalFloorSeconds, maxIntervalCeilingSeconds, attributeRequests, keepSubscriptions }: SubscribeRequest): SubscribeResponse | undefined {
        console.log(`Received subscribe request from ${exchange.channel.getName()}`);

        if (!exchange.session.isSecure()) throw new Error("Subscriptions are only implemented on secure sessions");

        const session = exchange.session as SecureSession;

        if (!keepSubscriptions) {
            session.clearSubscriptions();
        }

        if (attributeRequests !== undefined) {
            const attributes = attributeRequests.flatMap(path => this.device.getAttributes(path));

            if (attributeRequests.length === 0) throw new Error("Invalid subscription request");

            return {
                subscriptionId: session.addSubscription(SubscriptionHandler.Builder(session, exchange.channel.channel, session.getServer(), attributes)),
                minIntervalFloorSeconds,
                maxIntervalCeilingSeconds,
            };
        }
    }

    async handleInvokeRequest(exchange: MessageExchange, {invokes}: InvokeRequest): Promise<InvokeResponse> {
        console.log(`Received invoke request from ${exchange.channel.getName()}: ${invokes.map(({path: {endpointId, clusterId, commandId}}) => `${endpointId}/${clusterId}/${commandId}`).join(", ")}`);

        const results = (await Promise.all(invokes.map(({path, args}) => this.device.invoke(exchange.session, path, args)))).flat();
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

export class SubscriptionHandler {

    static Builder = (session: Session, channel: ExchangeSocket<Buffer>, server: MatterServer, attributes: Attribute<any>[]) => (subscriptionId: number) => new SubscriptionHandler(subscriptionId, session, channel, server, attributes);

    constructor(
        readonly subscriptionId: number,
        private readonly session: Session,
        private readonly channel: ExchangeSocket<Buffer>,
        private readonly server: MatterServer,
        private readonly attributes: Attribute<any>[],
    ) {
        // TODO: implement minIntervalFloorSeconds and maxIntervalCeilingSeconds

        attributes.forEach(attribute => attribute.addSubscription(this));
    }

    sendReport(report: Report) {
        // TODO: this should be sent to the last discovered address of this node instead of the one used to request the subscription

        const exchange = this.server.initiateExchange(this.session, this.channel, Protocol.INTERACTION_MODEL);
        new InteractionMessenger(exchange).sendDataReport({
            subscriptionId: this.subscriptionId,
            isFabricFiltered: true,
            interactionModelRevision: 1,
            values: [{ value: report }],
        });
    }

    cancel() {
        this.attributes.forEach(attribute => attribute.removeSubscription(this.subscriptionId));
    }
}
