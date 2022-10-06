/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { MessageExchange } from "../common/MessageExchange";
import { MatterController } from "../MatterController";
import { MatterDevice } from "../MatterDevice";
import { InvokeRequestT, InvokeResponseT, ReadRequestT, DataReportT, SubscribeRequestT, SubscribeResponseT, StatusCode, StatusResponseT } from "./InteractionMessages";

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

export type ReadRequest = JsType<typeof ReadRequestT>;
export type DataReport = JsType<typeof DataReportT>;
export type SubscribeRequest = JsType<typeof SubscribeRequestT>;
export type SubscribeResponse = JsType<typeof SubscribeResponseT>;
export type InvokeRequest = JsType<typeof InvokeRequestT>;
export type InvokeResponse = JsType<typeof InvokeResponseT>;


class InteractionMessenger<ContextT> {
    constructor(
        private readonly exchangeBase: MessageExchange<ContextT>,
    ) {}

    sendStatus(status: StatusCode) {
        return this.exchangeBase.send(MessageType.StatusResponse, TlvObjectCodec.encode({status, interactionModelRevision: 1}, StatusResponseT));
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

    protected throwIfError(messageType: number, payload: Buffer) {
        if (messageType !== MessageType.StatusResponse) return;
        const {status} = TlvObjectCodec.decode(payload, StatusResponseT);
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
    ) {
        const message = await this.exchange.nextMessage();
        try {
            switch (message.payloadHeader.messageType) {
                case MessageType.ReadRequest:
                    const readRequest = TlvObjectCodec.decode(message.payload, ReadRequestT);
                    this.sendDataReport(handleReadRequest(readRequest));
                    break;
                case MessageType.SubscribeRequest:
                    const subscribeRequest = TlvObjectCodec.decode(message.payload, SubscribeRequestT);
                    const subscribeResponse = handleSubscribeRequest(subscribeRequest);
                    if (subscribeResponse === undefined) {
                        this.sendStatus(StatusCode.Success);
                    } else {
                        this.exchange.send(MessageType.SubscribeResponse, TlvObjectCodec.encode(subscribeResponse, SubscribeResponseT));
                    }
                    break;
                case MessageType.InvokeCommandRequest:
                    const invokeRequest = TlvObjectCodec.decode(message.payload, InvokeRequestT);
                    const invokeResponse = await handleInvokeRequest(invokeRequest);
                    this.exchange.send(MessageType.InvokeCommandResponse, TlvObjectCodec.encode(invokeResponse, InvokeResponseT));
                    break;
                default:
                    throw new Error(`Unsupported message type ${message.payloadHeader.messageType}`);
            }
        } catch (error) {
            console.error(error);
            this.sendStatus(StatusCode.Failure);
        }
    }

    sendDataReport(dataReport: DataReport) {
        return this.exchange.send(MessageType.ReportData, TlvObjectCodec.encode(dataReport, DataReportT));
    }
}

export class InteractionClientMessenger extends InteractionMessenger<MatterController> {
    constructor(
        private readonly exchange: MessageExchange<MatterController>,
    ) {
        super(exchange);
    }

    sendReadRequest(readRequest: ReadRequest) {
        return this.request(MessageType.ReadRequest, ReadRequestT, MessageType.ReportData, DataReportT, readRequest);
    }

    sendSubscribeRequest(subscribeRequest: SubscribeRequest) {
        return this.request(MessageType.SubscribeRequest, SubscribeRequestT, MessageType.SubscribeResponse, SubscribeResponseT, subscribeRequest);
    }

    sendInvokeCommand(invokeRequest: InvokeRequest) {
        return this.request(MessageType.InvokeCommandRequest, InvokeRequestT, MessageType.InvokeCommandResponse, InvokeResponseT, invokeRequest);
    }

    private async request<RequestT, ResponseT>(requestMessageType: number, requestTemplate: Template<RequestT>, responseMessageType: number, responseTemplate: Template<ResponseT>, request: RequestT): Promise<ResponseT> {
        await this.exchange.send(requestMessageType, TlvObjectCodec.encode(request, requestTemplate));
        const responseMessage = await this.nextMessage(responseMessageType);
        return TlvObjectCodec.decode(responseMessage.payload, responseTemplate);
    }
}
