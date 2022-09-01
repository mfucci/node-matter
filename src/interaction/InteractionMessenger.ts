/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { MessageExchange } from "../server/MessageExchange";
import { InvokeRequestT, InvokeResponseT, ReadRequestT, ReadResponseT, SubscribeRequestT, SubscribeResponseT } from "./InteractionMessages";

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
export type ReadResponse = JsType<typeof ReadResponseT>;
export type SubscribeRequest = JsType<typeof SubscribeRequestT>;
export type SubscribeResponse = JsType<typeof SubscribeResponseT>;
export type InvokeRequest = JsType<typeof InvokeRequestT>;
export type InvokeResponse = JsType<typeof InvokeResponseT>;

export class InteractionMessenger {

    constructor(
        private readonly exchange: MessageExchange,
        private readonly handleReadRequest: (request: ReadRequest) => ReadResponse,
        private readonly handleSubscribeRequest: (request: SubscribeRequest) => SubscribeResponse,
        private readonly handleInvokeRequest: (request: InvokeRequest) => Promise<InvokeResponse>,
    ) {}

    async handleRequest() {
        const message = await this.exchange.nextMessage();
        switch (message.payloadHeader.messageType) {
            case MessageType.ReadRequest:
                const readRequest = TlvObjectCodec.decode(message.payload, ReadRequestT);
                const readResponse = this.handleReadRequest(readRequest);
                this.exchange.send(MessageType.ReportData, TlvObjectCodec.encode(readResponse, ReadResponseT));
                break;
            case MessageType.SubscribeRequest:
                const subscribeRequest = TlvObjectCodec.decode(message.payload, SubscribeRequestT);
                const subscribeResponse = this.handleSubscribeRequest(subscribeRequest);
                this.exchange.send(MessageType.SubscribeResponse, TlvObjectCodec.encode(subscribeResponse, SubscribeResponseT));
                break;
            case MessageType.InvokeCommandRequest:
                const invokeRequest = TlvObjectCodec.decode(message.payload, InvokeRequestT);
                const invokeResponse = await this.handleInvokeRequest(invokeRequest);
                this.exchange.send(MessageType.InvokeCommandResponse, TlvObjectCodec.encode(invokeResponse, InvokeResponseT));
                break;
            default:
                throw new Error(`Unsupported message type ${message.payloadHeader.messageType}`);
        }
    }
}
