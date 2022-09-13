/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { MessageExchange } from "../matter/common/MessageExchange";
import { MatterServer } from "../matter/MatterServer";
import { StatusResponseT } from "./cluster/OperationalCredentialsMessages";
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

export class InteractionMessenger {

    constructor(
        private readonly exchange: MessageExchange<MatterServer>,
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
                    this.sendDataReport(handleReadRequest(readRequest));
                    break;
                case MessageType.SubscribeRequest:
                    const subscribeRequest = TlvObjectCodec.decode(message.payload, SubscribeRequestT);
                    const subscribeResponse = handleSubscribeRequest(subscribeRequest);
                    if (subscribeRequest === undefined) {
                        this.sendStatus(Status.Success);
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
            this.sendStatus(Status.Failure);
        }
    }

    sendDataReport(dataReport: DataReport) {
        this.exchange.send(MessageType.ReportData, TlvObjectCodec.encode(dataReport, DataReportT));
    }

    private sendStatus(status: Status) {
        this.exchange.send(MessageType.StatusResponse, TlvObjectCodec.encode({status}, StatusResponseT));
    }
}
