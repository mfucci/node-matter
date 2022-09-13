/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageExchange } from "../../matter/common/MessageExchange";
import { LEBufferReader } from "../../util/LEBufferReader";
import { LEBufferWriter } from "../../util/LEBufferWriter";
import { GeneralStatusCode, ProtocolStatusCode, MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";

export class SecureChannelMessenger {
    constructor(
        protected readonly exchange: MessageExchange,
    ) {}

    sendError() {
        return this.sendStatusReport(GeneralStatusCode.Error, ProtocolStatusCode.InvalidParam);
    }

    sendSuccess() {
        return this.sendStatusReport(GeneralStatusCode.Success, ProtocolStatusCode.Success);
    }

    getChannelName() {
        return this.exchange.channel.channel.getName();
    }

    private async sendStatusReport(generalStatus: GeneralStatusCode, protocolStatus: ProtocolStatusCode) {
        const buffer = new LEBufferWriter();
        buffer.writeUInt16(generalStatus);
        buffer.writeUInt32(SECURE_CHANNEL_PROTOCOL_ID);
        buffer.writeUInt16(protocolStatus);
        await this.exchange.send(MessageType.StatusReport, buffer.toBuffer());
    }

    protected throwIfError(messageType: number, payload: Buffer) {
        if (messageType !== MessageType.StatusReport) return;
        const buffer = new LEBufferReader(payload);
        const generalStatus = buffer.readUInt16();
        const protocolId = buffer.readUInt32();
        const protocolStatus = buffer.readUInt16();
        throw new Error(`Received error status: ${generalStatus} ${protocolId} ${protocolStatus}`);
    }
}
