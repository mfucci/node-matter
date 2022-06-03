import { JsType, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Session } from "../session/SessionManager";
import { MessageExchange } from "../transport/Dispatcher";
import { InvokeRequestT, InvokeResponseT, ReadRequestT, ReadResponseT } from "./InteractionMessages";

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

export type InvokeRequest = JsType<typeof InvokeRequestT>;
export type InvokeResponse = JsType<typeof InvokeResponseT>;
export type ReadRequest = JsType<typeof ReadRequestT>;
export type ReadResponse = JsType<typeof ReadResponseT>;

export class InteractionMessenger {

    constructor(
        private readonly exchange: MessageExchange,
        private readonly handleReadRequest: (request: ReadRequest) => ReadResponse,
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
