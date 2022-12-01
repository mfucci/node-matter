/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageExchange } from "../../common/MessageExchange";
import { GeneralStatusCode, ProtocolStatusCode, MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { ByteArray, DataReader, DataWriter, Endian, TlvSchema } from "@project-chip/matter.js";

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

    async nextMessageDecoded<T>(expectedMessageType: number, schema: TlvSchema<T>) {
        return schema.decode((await this.nextMessage(expectedMessageType)).payload);
    }

    async waitForSuccess() {
        // If the status is not Success, this would throw an Error.
        await this.nextMessage(MessageType.StatusReport);
    }

    async send<T>(message: T, type: number, schema: TlvSchema<T>) {
        const payload = schema.encode(message);
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
        const writer = new DataWriter(Endian.Little);
        writer.writeUInt16(generalStatus);
        writer.writeUInt32(SECURE_CHANNEL_PROTOCOL_ID);
        writer.writeUInt16(protocolStatus);
        await this.exchange.send(MessageType.StatusReport, writer.toByteArray());
    }

    protected throwIfError(messageType: number, payload: ByteArray) {
        if (messageType !== MessageType.StatusReport) return;
        const reader = new DataReader(payload, Endian.Little);
        const generalStatus = reader.readUInt16();
        if (generalStatus === GeneralStatusCode.Success) return;
        const protocolId = reader.readUInt32();
        const protocolStatus = reader.readUInt16();
        throw new Error(`Received error status: ${generalStatus} ${protocolId} ${protocolStatus}`);
    }
}
