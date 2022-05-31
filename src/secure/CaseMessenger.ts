import { JsType, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { CaseSigma1T, CaseSigma2T, CaseSigma3T } from "./CaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export class CaseMessenger extends SecureChannelMessenger {
    async readSigma1() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        if (messageType !== MessageType.Sigma1) throw new Error(`Received unexpected message type: ${messageType}`);
        return { sigma1Bytes: payload, sigma1: TlvObjectCodec.decode(payload, CaseSigma1T) } ;
    }

    async sendSigma2(sigma2: JsType<typeof CaseSigma2T>) {
        const bytes = TlvObjectCodec.encode(sigma2, CaseSigma2T);
        await this.exchange.send(MessageType.Sigma2, bytes);
        return bytes;
    }

    async readSigma3() {
        const { payloadHeader: { messageType }, payload } = await this.exchange.nextMessage();
        this.throwIfError(messageType, payload);
        if (messageType !== MessageType.Sigma3) throw new Error(`Received unexpected message type: ${messageType}`);
        return {sigma3Bytes: payload, sigma3: TlvObjectCodec.decode(payload, CaseSigma3T)};
    }
}
