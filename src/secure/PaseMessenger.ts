import { JsType, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { PasePake1T, PasePake2T, PasePake3T, PbkdfParamRequestT, PbkdfParamResponseT } from "./PaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export type PasePake2 = JsType<typeof PasePake2T>;

export class PaseMessenger extends SecureChannelMessenger {
    async readPbkdfParamRequest() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        if (messageType !== MessageType.PbkdfParamRequest) throw new Error(`Received unexpected message type: ${messageType}`);
        return { requestPayload: payload, request: TlvObjectCodec.decode(payload, PbkdfParamRequestT) } ;
    }

    async sendPbkdfParamResponse<T>(response: T) {
        const payload = TlvObjectCodec.encode(response, PbkdfParamResponseT);
        await this.exchange.send(MessageType.PbkdfParamResponse, payload);
        return payload;
    }

    async readPasePake1() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        this.throwIfError(messageType, payload);
        if (messageType !== MessageType.PasePake1) throw new Error(`Received unexpected message type: ${messageType}`);
        return TlvObjectCodec.decode(payload, PasePake1T);
    }

    async sendPasePake2(pasePake2: PasePake2) {
        await this.exchange.send(MessageType.PasePake2, TlvObjectCodec.encode(pasePake2, PasePake2T));
    }

    async readPasePake3() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        this.throwIfError(messageType, payload);
        if (messageType !== MessageType.PasePake3) throw new Error(`Received unexpected message type: ${messageType}`);
        return TlvObjectCodec.decode(payload, PasePake3T);
    }
}
