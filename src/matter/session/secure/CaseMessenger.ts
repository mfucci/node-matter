/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { MatterController } from "../../MatterController";
import { MatterDevice } from "../../MatterDevice";
import { CaseSigma1T, CaseSigma2ResumeT, CaseSigma2T, CaseSigma3T } from "./CaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export class CaseServerMessenger extends SecureChannelMessenger<MatterDevice> {
    async readSigma1() {
        const { payload } = await this.nextMessage(MessageType.Sigma1);
        return { sigma1Bytes: payload, sigma1: TlvObjectCodec.decode(payload, CaseSigma1T) } ;
    }

    sendSigma2(sigma2: JsType<typeof CaseSigma2T>) {
        return this.send(sigma2, MessageType.Sigma2, CaseSigma2T);
    }

    sendSigma2Resume(sigma2Resume: JsType<typeof CaseSigma2ResumeT>) {
        return this.send(sigma2Resume, MessageType.Sigma2Resume, CaseSigma2ResumeT);
    }

    async readSigma3() {
        const { payload } = await this.nextMessage(MessageType.Sigma3);
        return { sigma3Bytes: payload, sigma3: TlvObjectCodec.decode(payload, CaseSigma3T) };
    }
}

export class CaseClientMessenger extends SecureChannelMessenger<MatterController> {

    sendSigma1(sigma1: JsType<typeof CaseSigma1T>) {
        return this.send(sigma1, MessageType.Sigma1, CaseSigma1T);
    }

    async readSigma2() {
        const { payload , payloadHeader: {messageType} } = await this.nextMessage();
        switch (messageType) {
            case MessageType.Sigma2:
                return { sigma2Bytes: payload, sigma2: TlvObjectCodec.decode(payload, CaseSigma2T) } ;
            case MessageType.Sigma2Resume:
                return { sigma2Resume: TlvObjectCodec.decode(payload, CaseSigma2ResumeT) } ;
            default:
                throw new Error(`Received unexpected message type: ${messageType}, expected: ${MessageType.Sigma2} or ${MessageType.Sigma2Resume}`);
        }
    }

    sendSigma3(sigma3: JsType<typeof CaseSigma3T>) {
        return this.send(sigma3, MessageType.Sigma3, CaseSigma3T);
    }
}
