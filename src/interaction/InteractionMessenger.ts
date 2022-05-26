import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { MessageExchange } from "../transport/Dispatcher";
import { InvokeRequest, InvokeRequestTemplate, InvokeResponse, InvokeResponseTemplate, ReadRequest, ReadRequestTemplate, ReadResponse, ReadResponseTemplate } from "./InteractionMessages";

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

export class InteractionMessenger {
    constructor(
        private readonly exchange: MessageExchange,
        private readonly handleReadRequest: (request: ReadRequest) => ReadResponse,
        private readonly handleInvokeRequest: (request: InvokeRequest) => InvokeResponse,
    ) {}

    async handleRequest() {
        const message = await this.exchange.nextMessage();
        switch (message.payloadHeader.messageType) {
            case MessageType.ReadRequest:
                const readRequest = TlvObjectCodec.decode(message.payload, ReadRequestTemplate);
                const readResponse = this.handleReadRequest(readRequest);
                this.exchange.send(MessageType.StatusResponse, TlvObjectCodec.encode(readResponse, ReadResponseTemplate));
                break;
            case MessageType.InvokeCommandRequest:
                const invokeRequest = TlvObjectCodec.decode(message.payload, InvokeRequestTemplate);
                const invokeResponse = this.handleInvokeRequest(invokeRequest);
                this.exchange.send(MessageType.StatusResponse, TlvObjectCodec.encode(invokeResponse, InvokeResponseTemplate));
                break;
            default:
                throw new Error(`Unsupported message type ${message.payloadHeader.messageType}`);
        }
    }
}