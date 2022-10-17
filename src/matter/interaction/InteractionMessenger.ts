/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Logger } from "../../log/Logger";
import { StatusResponseT } from "../cluster/OperationalCredentialsCluster";
import { MessageExchange } from "../common/MessageExchange";
import { MatterController } from "../MatterController";
import { MatterDevice } from "../MatterDevice";
import { InvokeRequestT, InvokeResponseT, ReadRequestT, DataReportT, SubscribeRequestT, SubscribeResponseT } from "./InteractionMessages";

export const enum Status {
    Success = 0x00,
    Failure = 0x01,  
}

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

const logger = Logger.get("InteractionServerMessenger");

export class InteractionServerMessenger {

    constructor(
        private readonly exchange: MessageExchange<MatterDevice>,
    ) {}

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
                    await this.sendDataReport(handleReadRequest(readRequest));
                    break;
                case MessageType.SubscribeRequest:
                    const subscribeRequest = TlvObjectCodec.decode(message.payload, SubscribeRequestT);
                    const subscribeResponse = handleSubscribeRequest(subscribeRequest);
                    if (subscribeRequest === undefined) {
                        await this.sendStatus(Status.Success);
                    } else {
                        await this.exchange.send(MessageType.SubscribeResponse, TlvObjectCodec.encode(subscribeResponse, SubscribeResponseT));
                    }
                    break;
                case MessageType.InvokeCommandRequest:
                    const invokeRequest = TlvObjectCodec.decode(message.payload, InvokeRequestT);
                    const invokeResponse = await handleInvokeRequest(invokeRequest);
                    await this.exchange.send(MessageType.InvokeCommandResponse, TlvObjectCodec.encode(invokeResponse, InvokeResponseT));
                    break;
                default:
                    throw new Error(`Unsupported message type ${message.payloadHeader.messageType}`);
            }
        } catch (error) {
            logger.error(error);
            await this.sendStatus(Status.Failure);
        } finally {
            this.exchange.close();
        }
    }

    async sendDataReport(dataReport: DataReport) {
        await this.exchange.send(MessageType.ReportData, TlvObjectCodec.encode(dataReport, DataReportT));
    }

    private async sendStatus(status: Status) {
        await this.exchange.send(MessageType.StatusResponse, TlvObjectCodec.encode({status}, StatusResponseT));
    }
}

export class InteractionClientMessenger {
    constructor(
        private readonly exchange: MessageExchange<MatterController>,
    ) {}

    sendReadRequest(readRequest: ReadRequest) {
        return this.request(MessageType.ReadRequest, ReadRequestT, MessageType.ReportData, DataReportT, readRequest);
    }

    sendSubscribeRequest(subscribeRequest: SubscribeRequest) {
        return this.request(MessageType.SubscribeRequest, SubscribeRequestT, MessageType.SubscribeResponse, SubscribeResponseT, subscribeRequest);
    }

    sendInvokeCommand(invokeRequest: InvokeRequest) {
        return this.request(MessageType.InvokeCommandRequest, InvokeRequestT, MessageType.InvokeCommandResponse, InvokeResponseT, invokeRequest);
    }

    close() {
        this.exchange.close();
    }

    private async request<RequestT, ResponseT>(requestMessageType: number, requestTemplate: Template<RequestT>, responseMessageType: number, responseTemplate: Template<ResponseT>, request: RequestT): Promise<ResponseT> {
        await this.exchange.send(requestMessageType, TlvObjectCodec.encode(request, requestTemplate));
        const responseMessage = await this.exchange.nextMessage();
        const messageType = responseMessage.payloadHeader.messageType;
        if (messageType !== responseMessageType) throw new Error(`Received unexpected message type: ${messageType}, expected: ${responseMessageType}`);
        return TlvObjectCodec.decode(responseMessage.payload, responseTemplate);
    }
}
