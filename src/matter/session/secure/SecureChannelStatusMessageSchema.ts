/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteArray, DataReader, DataWriter, Endian } from "@project-chip/matter.js";
import { GeneralStatusCode, ProtocolStatusCode, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";

export function decodeStatusReport(payload: ByteArray) {
    const reader = new DataReader(payload, Endian.Little);
    const generalStatus = reader.readUInt16();
    const protocolId = reader.readUInt32();
    const protocolStatus = reader.readUInt16();
    return { generalStatus, protocolId, protocolStatus };
}

export function encodeStatusReport(generalStatus: GeneralStatusCode, protocolStatus: ProtocolStatusCode) {
    const writer = new DataWriter(Endian.Little);
    writer.writeUInt16(generalStatus);
    writer.writeUInt32(SECURE_CHANNEL_PROTOCOL_ID);
    writer.writeUInt16(protocolStatus);
    return writer.toByteArray();
}
