/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from "../../log/Logger";
import { MessageExchange } from "../common/MessageExchange";
import { MatterController } from "../MatterController";
import { MatterDevice } from "../MatterDevice";
import { TlvInvokeRequest, TlvInvokeResponse, TlvReadRequest, TlvDataReport, TlvSubscribeRequest, TlvSubscribeResponse, StatusCode, TlvStatusResponse, TlvTimedRequest } from "./InteractionMessages";
import { ByteArray, TlvSchema, TypeFromSchema } from "@project-chip/matter.js";

export const enum MessageType {
    StatusResponse = 0x01,
    ReadRequest = 0x02,
    SubscribeRequest = 0x03,
    SubscribeResponse = 0x04,
    ReportData = 0x05,
    WriteRequest = 0x06,
    WriteResponse = 0x07,
    InvokeCommandRequest = 0x08,
    InvokeCommandResponse = 0x09,
    TimedRequest = 0x0a,
}

export type ReadRequest = TypeFromSchema<typeof TlvReadRequest>;
export type DataReport = TypeFromSchema<typeof TlvDataReport>;
export type SubscribeRequest = TypeFromSchema<typeof TlvSubscribeRequest>;
export type SubscribeResponse = TypeFromSchema<typeof TlvSubscribeResponse>;
export type InvokeRequest = TypeFromSchema<typeof TlvInvokeRequest>;
export type InvokeResponse = TypeFromSchema<typeof TlvInvokeResponse>;
export type TimedRequest = TypeFromSchema<typeof TlvTimedRequest>;

const logger = Logger.get("InteractionMessenger");

class InteractionMessenger<ContextT> {
    constructor(
        private readonly exchangeBase: MessageExchange<ContextT>,
    ) {}

    sendStatus(status: StatusCode) {
        return this.exchangeBase.send(MessageType.StatusResponse, TlvStatusResponse.encode({status, interactionModelRevision: 1}));
    }

    async waitForSuccess() {
        // If the status is not Success, this would throw an Error.
        await this.nextMessage(MessageType.StatusResponse);
    }

    async nextMessage(expectedMessageType?: number) {
        const message = await this.exchangeBase.nextMessage();
        const messageType = message.payloadHeader.messageType;
        this.throwIfError(messageType, message.payload);
        if (expectedMessageType !== undefined && messageType !== expectedMessageType) throw new Error(`Received unexpected message type: ${messageType}, expected: ${expectedMessageType}`);
        return message;
    }

    close() {
        this.exchangeBase.close();
    }

    protected throwIfError(messageType: number, payload: ByteArray) {
        if (messageType !== MessageType.StatusResponse) return;
        const {status} = TlvStatusResponse.decode(payload);
        if (status !== StatusCode.Success) new Error(`Received error status: ${status}`);
    }
}

export class InteractionServerMessenger extends InteractionMessenger<MatterDevice> {

    constructor(
        private readonly exchange: MessageExchange<MatterDevice>,
    ) {
        super(exchange);
    }

    async handleRequest(
        handleReadRequest: (request: ReadRequest) => DataReport,
        handleSubscribeRequest: (request: SubscribeRequest) => SubscribeResponse | undefined,
        handleInvokeRequest: (request: InvokeRequest) => Promise<InvokeResponse>,
        handleTimedRequest: (request: TimedRequest) => Promise<void>,
    ) { 
        let continueExchange = true;
        try {
            while (continueExchange) {
                const message = await this.exchange.nextMessage();
                continueExchange = false;
                switch (message.payloadHeader.messageType) {
                    case MessageType.ReadRequest:
                        const readRequest = TlvReadRequest.decode(message.payload);
                        await this.sendDataReport(handleReadRequest(readRequest));
                        break;
                    case MessageType.SubscribeRequest:
                        const subscribeRequest = TlvSubscribeRequest.decode(message.payload);
                        const subscribeResponse = handleSubscribeRequest(subscribeRequest);
                        if (subscribeResponse === undefined) {
                            await this.sendStatus(StatusCode.Success);
                        } else {
                            await this.exchange.send(MessageType.SubscribeResponse, TlvSubscribeResponse.encode(subscribeResponse));
                        }
                        break;
                    case MessageType.InvokeCommandRequest:
                        const invokeRequest = TlvInvokeRequest.decode(message.payload);
                        const invokeResponse = await handleInvokeRequest(invokeRequest);
                        await this.exchange.send(MessageType.InvokeCommandResponse, TlvInvokeResponse.encode(invokeResponse));
                        break;
                    case MessageType.TimedRequest:
                        const timedRequest = TlvTimedRequest.decode(message.payload);
                        await handleTimedRequest(timedRequest);
                        await this.sendStatus(StatusCode.Success);
                        continueExchange = true;
                        break;
                    default:
                        throw new Error(`Unsupported message type ${message.payloadHeader.messageType}`);
                }
            }
        } catch (error: any) {
            logger.error(error.stack ?? error);
            await this.sendStatus(StatusCode.Failure);
        } finally {
            this.exchange.close();
        }
    }

    async sendDataReport(dataReport: DataReport) {
        await this.exchange.send(MessageType.ReportData, TlvDataReport.encode(dataReport));
    }
}

export class InteractionClientMessenger extends InteractionMessenger<MatterController> {
    constructor(
        private readonly exchange: MessageExchange<MatterController>,
    ) {
        super(exchange);
    }

    sendReadRequest(readRequest: ReadRequest) {
        return this.request(MessageType.ReadRequest, TlvReadRequest, MessageType.ReportData, TlvDataReport, readRequest);
    }

    sendSubscribeRequest(subscribeRequest: SubscribeRequest) {
        return this.request(MessageType.SubscribeRequest, TlvSubscribeRequest, MessageType.SubscribeResponse, TlvSubscribeResponse, subscribeRequest);
    }

    sendInvokeCommand(invokeRequest: InvokeRequest) {
        return this.request(MessageType.InvokeCommandRequest, TlvInvokeRequest, MessageType.InvokeCommandResponse, TlvInvokeResponse, invokeRequest);
    }

    async readDataReport(): Promise<DataReport> {
        const dataReportMessage = await this.exchange.waitFor(MessageType.ReportData);
        return TlvDataReport.decode(dataReportMessage.payload);
    }

    private async request<RequestT, ResponseT>(requestMessageType: number, requestSchema: TlvSchema<RequestT>, responseMessageType: number, responseSchema: TlvSchema<ResponseT>, request: RequestT): Promise<ResponseT> {
        await this.exchange.send(requestMessageType, requestSchema.encode(request));
        const responseMessage = await this.nextMessage(responseMessageType);
        return responseSchema.decode(responseMessage.payload);
    }
}
