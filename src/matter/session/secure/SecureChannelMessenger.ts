/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageExchange } from "../../common/MessageExchange";
import { GeneralStatusCode, ProtocolStatusCode, MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { ByteArray, DataReader, DataWriter, Endian, TlvSchema } from "@project-chip/matter.js";
import { MatterError } from "../../../error/MatterError";

/** Error base Class for all errors related to the status response messages. */
export class ChannelStatusResponseError extends MatterError {
    public constructor(
        public readonly message: string,
        public readonly generalStatusCode: GeneralStatusCode,
        public readonly protocolStatusCode: ProtocolStatusCode,
    ) {
        super(`(${generalStatusCode}/${protocolStatusCode}) ${message}`);
    }
}

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
        await this.nextMessage(MessageType.StatusReport); // this also throws if the status is not success
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

    decodeStatusReport(payload: ByteArray) {
        const reader = new DataReader(payload, Endian.Little);
        const generalStatus = reader.readUInt16();
        const protocolId = reader.readUInt32();
        const protocolStatus = reader.readUInt16();
        return { generalStatus, protocolId, protocolStatus };
    }

    protected throwIfError(messageType: number, payload: ByteArray) {
        if (messageType !== MessageType.StatusReport) return;
        const { generalStatus, protocolId, protocolStatus } = this.decodeStatusReport(payload);
        if (generalStatus !== GeneralStatusCode.Success) {
            throw new ChannelStatusResponseError(`Received error status: ${generalStatus} ${protocolId} ${protocolStatus}`, generalStatus, protocolStatus);
        }
        if (protocolStatus !== ProtocolStatusCode.Success) {
            throw new ChannelStatusResponseError(`Received success status, but protocol status is not Success: ${protocolStatus}`, generalStatus, protocolStatus);
        }
    }
}
