/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { MatterClient } from "../../matter/MatterClient";
import { MatterServer } from "../../matter/MatterServer";
import { CaseSigma1T, CaseSigma2T, CaseSigma3T } from "./CaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export class CaseServerMessenger extends SecureChannelMessenger<MatterServer> {
    async readSigma1() {
        const { payload } = await this.nextMessage(MessageType.Sigma1);
        return { sigma1Bytes: payload, sigma1: TlvObjectCodec.decode(payload, CaseSigma1T) } ;
    }

    sendSigma2(sigma2: JsType<typeof CaseSigma2T>) {
        return this.send(sigma2, MessageType.Sigma2, CaseSigma2T);
    }

    async readSigma3() {
        const { payload } = await this.nextMessage(MessageType.Sigma3);
        return { sigma3Bytes: payload, sigma3: TlvObjectCodec.decode(payload, CaseSigma3T) };
    }
}

export class CaseClientMessenger extends SecureChannelMessenger<MatterClient> {

    sendSigma1(sigma1: JsType<typeof CaseSigma1T>) {
        return this.send(sigma1, MessageType.Sigma1, CaseSigma1T);
    }

    async readSigma2() {
        const { payload } = await this.nextMessage(MessageType.Sigma2);
        return { sigma2Bytes: payload, sigma2: TlvObjectCodec.decode(payload, CaseSigma2T) } ;
    }

    sendSigma3(sigma3: JsType<typeof CaseSigma3T>) {
        return this.send(sigma3, MessageType.Sigma3, CaseSigma3T);
    }
}
