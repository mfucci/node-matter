/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NodeId, nodeIdToBigint } from "../matter/common/NodeId";
import { LEBufferReader } from "../util/LEBufferReader";
import { LEBufferWriter } from "../util/LEBufferWriter";

export interface PacketHeader {
    sessionId: number,
    sessionType: SessionType,
    messageId: number,
    sourceNodeId?: NodeId,
    destNodeId?: NodeId,
    destGroupId?: number,
}

export interface PayloadHeader {
    exchangeId: number,
    protocolId: number,
    messageType: number,
    isInitiatorMessage: boolean,
    requiresAck: boolean,
    ackedMessageId?: number,
}

export interface Packet {
    header: PacketHeader,
    bytes: Buffer,
}

export interface Message {
    packetHeader: PacketHeader,
    payloadHeader: PayloadHeader,
    payload: Buffer,
}

const HEADER_VERSION = 0x00;

export const enum SessionType {
    Group = 1,
    Unicast = 0,
}

const COMMON_VENDOR_ID = 0x0000;

const enum PacketHeaderFlag {
    HasDestNodeId = 0b00000001,
    HasDestGroupId = 0b00000010,
    HasSourceNodeId = 0b00000100,
    Reserved = 0b00001000,
    VersionMask = 0b11110000,
}

const enum PayloadHeaderFlag {
    IsInitiatorMessage = 0b00000001,
    IsAckMessage = 0b00000010,
    RequiresAck = 0b00000100,
    HasSecureExtension = 0b00001000,
    HasVendorId = 0b00010000,
}

export class MessageCodec {

    static decodePacket(data: Buffer): Packet {
        const reader = new LEBufferReader(data);
        const header = this.decodePacketHeader(reader);

        return {
            header,
            bytes: reader.getRemainingBytes(),
        };
    }

    static decodePayload({header, bytes}: Packet): Message {
        const reader = new LEBufferReader(bytes);
        return {
            packetHeader: header,
            payloadHeader: this.decodePayloadHeader(reader),
            payload: reader.getRemainingBytes(),
        };
    }

    static encodePayload({packetHeader, payloadHeader, payload}: Message): Packet {
        return {
            header: packetHeader,
            bytes: Buffer.concat([
                this.encodePayloadHeader(payloadHeader),
                payload,
            ]),
        };
    }

    static encodePacket({header, bytes}: Packet): Buffer {
        return Buffer.concat([
            this.encodePacketHeader(header),
            bytes,
        ]);
    }

    private static decodePacketHeader(reader: LEBufferReader) {
        // Read and parse flags
        const flags = reader.readUInt8();
        const version = (flags & PacketHeaderFlag.VersionMask) >> 4;
        const hasDestNodeId = (flags & PacketHeaderFlag.HasDestNodeId) !== 0;
        const hasDestGroupId = (flags & PacketHeaderFlag.HasDestGroupId) !== 0;
        const hasSourceNodeId = (flags & PacketHeaderFlag.HasSourceNodeId) !== 0;

        if (hasDestNodeId && hasDestGroupId) throw new Error("The header cannot contain destination group and node at the same time");
        if (version !== HEADER_VERSION) throw new Error(`Unsupported header version ${version}`);

        const sessionId = reader.readUInt16();
        const securityFlags = reader.readUInt8();
        const messageId = reader.readUInt32();
        const sourceNodeId = hasSourceNodeId ? NodeId(reader.readUInt64()) : undefined;
        const destNodeId = hasDestNodeId ? NodeId(reader.readUInt64()) : undefined;
        const destGroupId = hasDestGroupId ? reader.readUInt16() : undefined;

        const sessionType = securityFlags & 0b00000011;
        if (sessionType !== SessionType.Group && sessionType !== SessionType.Unicast) throw new Error(`Unsupported session type ${sessionType}`);

        return { sessionId, sourceNodeId, messageId, destGroupId, destNodeId, sessionType };
    }

    private static decodePayloadHeader(reader: LEBufferReader): PayloadHeader {
        const exchangeFlags = reader.readUInt8();
        const isInitiatorMessage = (exchangeFlags & PayloadHeaderFlag.IsInitiatorMessage) !== 0;
        const isAckMessage = (exchangeFlags & PayloadHeaderFlag.IsAckMessage) !== 0;
        const requiresAck = (exchangeFlags & PayloadHeaderFlag.RequiresAck) !== 0;
        const hasSecuredExtension = (exchangeFlags & PayloadHeaderFlag.HasSecureExtension) !== 0;
        const hasVendorId = (exchangeFlags & PayloadHeaderFlag.HasVendorId) !== 0;
        if (hasSecuredExtension) throw new Error("Secured extension is not supported");

        const messageType = reader.readUInt8();
        const exchangeId = reader.readUInt16();
        const vendorId = hasVendorId ? reader.readUInt16() : COMMON_VENDOR_ID;
        const protocolId = vendorId << 16 | reader.readUInt16();
        const ackedMessageId = isAckMessage ? reader.readUInt32() : undefined;

        return {protocolId, exchangeId, messageType, isInitiatorMessage, requiresAck, ackedMessageId};
    }

    static encodePacketHeader({messageId: messageCounter, sessionId, destGroupId, destNodeId, sourceNodeId, sessionType}: PacketHeader) {
        const writer = new LEBufferWriter();
        const flags = (HEADER_VERSION << 4)
            | (destGroupId !== undefined ? PacketHeaderFlag.HasDestGroupId : 0)
            | (destNodeId !== undefined ? PacketHeaderFlag.HasDestNodeId : 0)
            | (sourceNodeId !== undefined ? PacketHeaderFlag.HasSourceNodeId : 0);
        const securityFlags = sessionType;

        writer.writeUInt8(flags);
        writer.writeUInt16(sessionId);
        writer.writeUInt8(securityFlags);
        writer.writeUInt32(messageCounter);
        if (sourceNodeId !== undefined) writer.writeUInt64(nodeIdToBigint(sourceNodeId));
        if (destNodeId !== undefined) writer.writeUInt64(nodeIdToBigint(destNodeId));
        if (destGroupId !== undefined) writer.writeUInt32(destGroupId);
        return writer.toBuffer();
    }

    static messageToString({packetHeader: {messageId, sessionId}, payloadHeader: {exchangeId, messageType, protocolId, ackedMessageId, requiresAck}, payload}: Message) {
        return `id:${sessionId}/${exchangeId}/${messageId} t:${protocolId}/${messageType}${ackedMessageId !== undefined ? ` acked:${ackedMessageId}` : ''} reqAck:${requiresAck} payload: ${payload.toString("hex")}`;
    }

    private static encodePayloadHeader({exchangeId, isInitiatorMessage, messageType, protocolId, requiresAck, ackedMessageId: ackedMessageCounter}: PayloadHeader) {
        const writer = new LEBufferWriter();
        const vendorId = (protocolId & 0xFFFF0000) >> 16;
        const flags = (isInitiatorMessage ? PayloadHeaderFlag.IsInitiatorMessage : 0)
            | (ackedMessageCounter !== undefined ? PayloadHeaderFlag.IsAckMessage : 0)
            | (requiresAck ? PayloadHeaderFlag.RequiresAck : 0)
            | (vendorId !== COMMON_VENDOR_ID ? PayloadHeaderFlag.HasVendorId : 0);

        writer.writeUInt8(flags);
        writer.writeUInt8(messageType);
        writer.writeUInt16(exchangeId);
        (vendorId !== COMMON_VENDOR_ID) ? writer.writeUInt32(protocolId) : writer.writeUInt16(protocolId);
        if (ackedMessageCounter !== undefined) writer.writeUInt32(ackedMessageCounter);
        return writer.toBuffer();
    }
}
