/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { MessageExchange } from "../../common/MessageExchange";
import { LEBufferReader } from "../../../util/LEBufferReader";
import { LEBufferWriter } from "../../../util/LEBufferWriter";
import { GeneralStatusCode, ProtocolStatusCode, MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { DataModel } from "../../../codec/DataModels";

export class SecureChannelMessenger<ContextT> {
    constructor(
        protected readonly exchange: MessageExchange<ContextT>,
    ) {}

    async nextMessage(expectedMessageType?: number) {
        const message = await this.exchange.nextMessage();
        const messageType = message.payloadHeader.messageType;
        this.throwIfError(messageType, message.payload);
        if (expectedMessageType !== undefined && messageType !== expectedMessageType) throw new Error(`Received unexpected message type: ${messageType}, expected: ${expectedMessageType}`);
        return message;
    }

    async nextMessageDecoded<T>(expectedMessageType: number, template: DataModel<T>) {
        return TlvObjectCodec.decode((await this.nextMessage(expectedMessageType)).payload, template);
    }

    async waitForSuccess() {
        // If the status is not Success, this would throw an Error.
        await this.nextMessage(MessageType.StatusReport);
    }

    async send<T>(message: T, type: number, template: DataModel<T>) {
        const payload = TlvObjectCodec.encode(message, template);
        await this.exchange.send(type, payload);
        return payload;
    }

    sendError() {
        return this.sendStatusReport(GeneralStatusCode.Error, ProtocolStatusCode.InvalidParam);
    }

    sendSuccess() {
        return this.sendStatusReport(GeneralStatusCode.Success, ProtocolStatusCode.Success);
    }

    getChannelName() {
        return this.exchange.channel.channel.getName();
    }

    close() {
        this.exchange.close();
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
        if (generalStatus === GeneralStatusCode.Success) return;
        const protocolId = buffer.readUInt32();
        const protocolStatus = buffer.readUInt16();
        throw new Error(`Received error status: ${generalStatus} ${protocolId} ${protocolStatus}`);
    }
}
