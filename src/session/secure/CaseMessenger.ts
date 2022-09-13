/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsType, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { MatterServer } from "../../matter/MatterServer";
import { CaseSigma1T, CaseSigma2T, CaseSigma3T } from "./CaseMessages";
import { MessageType } from "./SecureChannelMessages";
import { SecureChannelMessenger } from "./SecureChannelMessenger";

export class CaseMessenger extends SecureChannelMessenger<MatterServer> {
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
