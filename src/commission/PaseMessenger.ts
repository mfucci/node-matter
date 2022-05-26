import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { MessageExchange } from "../transport/Dispatcher";
import { LEBufferReader } from "../util/LEBufferReader";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { PasePake1Template, PasePake2, PasePake2Template, PasePake3Template, PbkdfParamRequestTemplate, PbkdfParamResponse, PbkdfParamResponseTemplate } from "./PaseMessages";

const enum SpakeMessageType {
    PbkdfParamRequest = 0x20,
    PbkdfParamResponse = 0x21,
    PasePake1 = 0x22,
    PasePake2 = 0x23,
    PasePake3 = 0x24,
    StatusReport = 0x40,
}

const COMMISSSION_PROTOCOL_ID = 0x00000000;

const enum ProtocolStatusCode {
    Success = 0x0000,
    InvalidParam = 0x0002,
}

const enum GeneralStatusCode {
    Success = 0x0000,
    Error = 0x0001,
}

export class PakeMessenger {
    constructor(
        private readonly exchange: MessageExchange,
    ) {}

    async readPbkdfParamRequest() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        if (messageType !== SpakeMessageType.PbkdfParamRequest) throw new Error(`Received unexpected message type: ${messageType}`);
        return { requestPayload: payload, request: TlvObjectCodec.decode(payload, PbkdfParamRequestTemplate) } ;
    }

    async sendPbkdfParamResponse(response: PbkdfParamResponse) {
        const payload = TlvObjectCodec.encode(response, PbkdfParamResponseTemplate);
        await this.exchange.send(SpakeMessageType.PbkdfParamResponse, payload);
        return payload;
    }

    async readPasePake1() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        this.throwIfError(messageType, payload);
        if (messageType !== SpakeMessageType.PasePake1) throw new Error(`Received unexpected message type: ${messageType}`);
        return TlvObjectCodec.decode(payload, PasePake1Template);
    }

    async sendPasePake2(pasePake2: PasePake2) {
        await this.exchange.send(SpakeMessageType.PasePake2, TlvObjectCodec.encode(pasePake2, PasePake2Template));
    }

    async readPasePake3() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        this.throwIfError(messageType, payload);
        if (messageType !== SpakeMessageType.PasePake3) throw new Error(`Received unexpected message type: ${messageType}`);
        return TlvObjectCodec.decode(payload, PasePake3Template);
    }

    sendError() {
        return this.sendStatusReport(GeneralStatusCode.Error, ProtocolStatusCode.InvalidParam);
    }

    sendSuccess() {
        return this.sendStatusReport(GeneralStatusCode.Success, ProtocolStatusCode.Success);
    }

    private async sendStatusReport(generalStatus: GeneralStatusCode, protocolStatus: ProtocolStatusCode) {
        const buffer = new LEBufferWriter();
        buffer.writeUInt16(generalStatus);
        buffer.writeUInt32(COMMISSSION_PROTOCOL_ID);
        buffer.writeUInt16(protocolStatus);
        await this.exchange.send(SpakeMessageType.StatusReport, buffer.toBuffer());
    }

    private throwIfError(messageType: number, payload: Buffer) {
        if (messageType !== SpakeMessageType.StatusReport) return;
        const buffer = new LEBufferReader(payload);
        const generalStatus = buffer.readUInt16();
        const protocolId = buffer.readUInt32();
        const protocolStatus = buffer.readUInt16();
        throw new Error(`Received error status: ${generalStatus} ${protocolId} ${protocolStatus}`);
    }
}
