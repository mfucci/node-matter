/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from "../../log/Logger";
import { MessageExchange } from "../common/MessageExchange";
import { MatterController } from "../MatterController";
import { MatterDevice } from "../MatterDevice";
import {
    StatusCode,
    TlvAttributeReport,
    TlvDataReport,
    TlvInvokeRequest,
    TlvInvokeResponse,
    TlvReadRequest,
    TlvStatusResponse,
    TlvSubscribeRequest,
    TlvSubscribeResponse,
    TlvTimedRequest,
    TlvWriteRequest,
    TlvWriteResponse
} from "./InteractionMessages";
import { ByteArray, TlvSchema, TypeFromSchema } from "@project-chip/matter.js";
import { Message } from "../../codec/MessageCodec";
import { MatterError } from "../../error/MatterError";

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
export type WriteRequest = TypeFromSchema<typeof TlvWriteRequest>;
export type WriteResponse = TypeFromSchema<typeof TlvWriteResponse>;

/** Error base Class for all errors related to the status response messages. */
export class StatusResponseError extends MatterError {
    public constructor(
        public readonly message: string,
        public readonly code: StatusCode,
    ) {
        super();

        this.message = `(${code}) ${message}`;
    }
}

const MAX_SPDU_LENGTH = 1024;

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

    protected throwIfError(messageType: number, payload: ByteArray) {
        if (messageType !== MessageType.StatusResponse) return;
        const { status } = TlvStatusResponse.decode(payload);
        if (status !== StatusCode.Success) throw new StatusResponseError(`Received error status: ${ status }`, status);
    }

    close() {
        this.exchangeBase.close();
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
        handleWriteRequest: (request: WriteRequest) => WriteResponse,
        handleSubscribeRequest: (request: SubscribeRequest) => SubscribeResponse | undefined,
        handleInvokeRequest: (request: InvokeRequest, message: Message) => Promise<InvokeResponse>,
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
                    case MessageType.WriteRequest:
                        const writeRequest = TlvWriteRequest.decode(message.payload);
                        const writeResponse = handleWriteRequest(writeRequest);
                        await this.exchange.send(MessageType.WriteResponse, TlvWriteResponse.encode(writeResponse));
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
                        const invokeResponse = await handleInvokeRequest(invokeRequest, message);
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
        const messageBytes = TlvDataReport.encode(dataReport);
        if (messageBytes.length > MAX_SPDU_LENGTH) {
            // DataReport is too long, it needs to be sent in chunks
            const attributeReportsToSend = [...dataReport.values];
            dataReport.values.length = 0;
            dataReport.moreChunkedMessages = true;

            const emptyDataReportBytes = TlvDataReport.encode(dataReport);

            let messageSize = emptyDataReportBytes.length;
            while (true) {
                const attributeReport = attributeReportsToSend.pop();
                if (attributeReport === undefined) {
                    // No more chunks to send
                    dataReport.moreChunkedMessages = undefined;
                    break;
                }
                const attributeReportBytes = TlvAttributeReport.encode(attributeReport).length;
                if (messageSize + attributeReportBytes > MAX_SPDU_LENGTH) {
                    // Report doesn't fit, sending this chunk
                    await this.exchange.send(MessageType.ReportData, TlvDataReport.encode(dataReport));
                    await this.waitForSuccess();
                    dataReport.values.length = 0;
                    messageSize = emptyDataReportBytes.length;
                }
                messageSize += attributeReportBytes;
                dataReport.values.push(attributeReport);
            }
        }

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
