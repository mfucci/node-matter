/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { MatterController } from "../../MatterController";
import { MatterDevice } from "../../MatterDevice";
import { PasePake1T, PasePake2T, PasePake3T, PbkdfParamRequestT, PbkdfParamResponseT } from "./PaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export const DEFAULT_PASSCODE_ID = 0;
export const SPAKE_CONTEXT = Buffer.from("CHIP PAKE V1 Commissioning");

type PbkdfParamRequest = JsType<typeof PbkdfParamRequestT>;
type PbkdfParamResponse = JsType<typeof PbkdfParamResponseT>;
type PasePake1 = JsType<typeof PasePake1T>;
type PasePake2 = JsType<typeof PasePake2T>;
type PasePake3 = JsType<typeof PasePake3T>;

export class PaseServerMessenger extends SecureChannelMessenger<MatterDevice> {
    async readPbkdfParamRequest() {
        const { payload } = await this.nextMessage(MessageType.PbkdfParamRequest);
        return { requestPayload: payload, request: TlvObjectCodec.decode(payload, PbkdfParamRequestT) } ;
    }

    async sendPbkdfParamResponse(response: PbkdfParamResponse) {
        return this.send(response, MessageType.PbkdfParamResponse, PbkdfParamResponseT);
    }

    readPasePake1() {
        return this.nextMessageDecoded(MessageType.PasePake1, PasePake1T);
    }

    sendPasePake2(pasePake2: PasePake2) {
        return this.send(pasePake2, MessageType.PasePake2, PasePake2T);
    }

    readPasePake3() {
        return this.nextMessageDecoded(MessageType.PasePake3, PasePake3T);
    }
}

export class PaseClientMessenger extends SecureChannelMessenger<MatterController> {
    sendPbkdfParamRequest(request: PbkdfParamRequest) {
        return this.send(request, MessageType.PbkdfParamRequest, PbkdfParamRequestT);
    }

    async readPbkdfParamResponse() {
        const { payload } = await this.nextMessage(MessageType.PbkdfParamResponse);
        return { responsePayload: payload, response: TlvObjectCodec.decode(payload, PbkdfParamResponseT) } ;
    }

    sendPasePake1(pasePake1: PasePake1) {
        return this.send(pasePake1, MessageType.PasePake1, PasePake1T);
    }

    readPasePake2() {
        return this.nextMessageDecoded(MessageType.PasePake2, PasePake2T);
    }

    sendPasePake3(pasePake3: PasePake3) {
        return this.send(pasePake3, MessageType.PasePake3, PasePake3T);
    }
}
