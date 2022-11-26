/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterController } from "../../MatterController";
import { MatterDevice } from "../../MatterDevice";
import { TlvCaseSigma1, TlvCaseSigma2Resume, TlvCaseSigma2, TlvCaseSigma3 } from "./CaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";
import { tlv } from "@project-chip/matter.js";

export class CaseServerMessenger extends SecureChannelMessenger<MatterDevice> {
    async readSigma1() {
        const { payload } = await this.nextMessage(MessageType.Sigma1);
        return { sigma1Bytes: payload, sigma1: TlvCaseSigma1.decode(payload) } ;
    }

    sendSigma2(sigma2: tlv.TypeFromSchema<typeof TlvCaseSigma2>) {
        return this.send(sigma2, MessageType.Sigma2, TlvCaseSigma2);
    }

    sendSigma2Resume(sigma2Resume: tlv.TypeFromSchema<typeof TlvCaseSigma2Resume>) {
        return this.send(sigma2Resume, MessageType.Sigma2Resume, TlvCaseSigma2Resume);
    }

    async readSigma3() {
        const { payload } = await this.nextMessage(MessageType.Sigma3);
        return { sigma3Bytes: payload, sigma3: TlvCaseSigma3.decode(payload) };
    }
}

export class CaseClientMessenger extends SecureChannelMessenger<MatterController> {
    sendSigma1(sigma1: tlv.TypeFromSchema<typeof TlvCaseSigma1>) {
        return this.send(sigma1, MessageType.Sigma1, TlvCaseSigma1);
    }

    async readSigma2() {
        const { payload , payloadHeader: {messageType} } = await this.nextMessage();
        switch (messageType) {
            case MessageType.Sigma2:
                return { sigma2Bytes: payload, sigma2: TlvCaseSigma2.decode(payload) } ;
            case MessageType.Sigma2Resume:
                return { sigma2Resume: TlvCaseSigma2Resume.decode(payload) } ;
            default:
                throw new Error(`Received unexpected message type: ${messageType}, expected: ${MessageType.Sigma2} or ${MessageType.Sigma2Resume}`);
        }
    }

    sendSigma3(sigma3: tlv.TypeFromSchema<typeof TlvCaseSigma3>) {
        return this.send(sigma3, MessageType.Sigma3, TlvCaseSigma3);
    }
}
