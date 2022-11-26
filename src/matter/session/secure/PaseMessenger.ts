/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterController } from "../../MatterController";
import { MatterDevice } from "../../MatterDevice";
import { TlvPasePake1, TlvPasePake2, TlvPasePake3, TlvPbkdfParamRequest, TlvPbkdfParamResponse } from "./PaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";
import { tlv, util } from "@project-chip/matter.js";

export const DEFAULT_PASSCODE_ID = 0;
export const SPAKE_CONTEXT = util.ByteArray.fromString("CHIP PAKE V1 Commissioning");

type PbkdfParamRequest = tlv.TypeFromSchema<typeof TlvPbkdfParamRequest>;
type PbkdfParamResponse = tlv.TypeFromSchema<typeof TlvPbkdfParamResponse>;
type PasePake1 = tlv.TypeFromSchema<typeof TlvPasePake1>;
type PasePake2 = tlv.TypeFromSchema<typeof TlvPasePake2>;
type PasePake3 = tlv.TypeFromSchema<typeof TlvPasePake3>;

export class PaseServerMessenger extends SecureChannelMessenger<MatterDevice> {
    async readPbkdfParamRequest() {
        const { payload } = await this.nextMessage(MessageType.PbkdfParamRequest);
        return { requestPayload: payload, request: TlvPbkdfParamRequest.decode(payload) } ;
    }

    async sendPbkdfParamResponse(response: PbkdfParamResponse) {
        return this.send(response, MessageType.PbkdfParamResponse, TlvPbkdfParamResponse);
    }

    readPasePake1() {
        return this.nextMessageDecoded(MessageType.PasePake1, TlvPasePake1);
    }

    sendPasePake2(pasePake2: PasePake2) {
        return this.send(pasePake2, MessageType.PasePake2, TlvPasePake2);
    }

    readPasePake3() {
        return this.nextMessageDecoded(MessageType.PasePake3, TlvPasePake3);
    }
}

export class PaseClientMessenger extends SecureChannelMessenger<MatterController> {
    sendPbkdfParamRequest(request: PbkdfParamRequest) {
        return this.send(request, MessageType.PbkdfParamRequest, TlvPbkdfParamRequest);
    }

    async readPbkdfParamResponse() {
        const { payload } = await this.nextMessage(MessageType.PbkdfParamResponse);
        return { responsePayload: payload, response: TlvPbkdfParamResponse.decode(payload) } ;
    }

    sendPasePake1(pasePake1: PasePake1) {
        return this.send(pasePake1, MessageType.PasePake1, TlvPasePake1);
    }

    readPasePake2() {
        return this.nextMessageDecoded(MessageType.PasePake2, TlvPasePake2);
    }

    sendPasePake3(pasePake3: PasePake3) {
        return this.send(pasePake3, MessageType.PasePake3, TlvPasePake3);
    }
}
