/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import net from "net";
import { BEBufferWriter } from "../util/BEBufferWriter";
import { BEBufferReader } from "../util/BEBufferReader";

export const PtrRecord = (name: string, ptr: string):Record<string> => ({ name, value: ptr, ttl: 120, recordType: RecordType.PTR, recordClass: RecordClass.IN });
export const ARecord = (name: string, ip: string):Record<string> => ({ name, value: ip, ttl: 120, recordType: RecordType.A, recordClass: RecordClass.IN });
export const AAAARecord = (name: string, ip: string):Record<string> => ({ name, value: ip, ttl: 120, recordType: RecordType.AAAA, recordClass: RecordClass.IN });
export const TxtRecord = (name: string, entries: string[]):Record<string[]> => ({ name, value: entries, ttl: 120, recordType: RecordType.TXT, recordClass: RecordClass.IN });
export const SrvRecord = (name: string, srv: SrvRecordValue):Record<SrvRecordValue> => ({ name, value: srv, ttl: 120, recordType: RecordType.SRV, recordClass: RecordClass.IN });

export interface SrvRecordValue {
    priority: number,
    weight: number,
    port: number,
    target: string,
}

export interface Query {
    name: string,
    recordType: RecordType,
    recordClass: RecordClass,
}

export interface Record<T> {
    name: string,
    recordType: RecordType,
    recordClass: RecordClass,
    ttl: number,
    value: T,
}

export interface DnsMessage {
    transactionId: number,
    messageType: MessageType,
    queries: Query[],
    answers: Record<any>[],
    authorities: Record<any>[],
    additionalRecords: Record<any>[],
}

export const enum MessageType {
    Query = 0x0000,
    Response = 0x8000,
}

export const enum RecordType {
    A = 0x01,
    PTR = 0x0C,
    TXT = 0x10,
    AAAA = 0x1C,
    SRV = 0x21,
}

const enum RecordClass {
    IN = 0x01,
}

export class DnsCodec {
    static decode(message: Buffer): DnsMessage {
        const reader = new BEBufferReader(message);
        const transactionId = reader.readUInt16();
        const messageType = reader.readUInt16();
        const queriesCount = reader.readUInt16();
        const answersCount = reader.readUInt16();
        const authoritiesCount = reader.readUInt16();
        const additionalRecordsCount = reader.readUInt16();
        const queries = new Array<Query>();
        for (var i = 0; i < queriesCount; i++) {
            queries.push(this.decodeQuery(reader, message));
        }
        const answers = new Array<Record<any>>();
        for (var i = 0; i < answersCount; i++) {
            answers.push(this.decodeRecord(reader, message));
        }
        const authorities = new Array<Record<any>>();
        for (var i = 0; i < authoritiesCount; i++) {
            authorities.push(this.decodeRecord(reader, message));
        }
        const additionalRecords = new Array<Record<any>>();
        for (var i = 0; i < additionalRecordsCount; i++) {
            additionalRecords.push(this.decodeRecord(reader, message));
        }
        return { transactionId, messageType, queries, answers, authorities, additionalRecords };
    }

    private static decodeQuery(reader: BEBufferReader, message: Buffer) {
        const name = this.decodeQName(reader, message);
        const recordType = reader.readUInt16();
        const recordClass = reader.readUInt16();
        return { name, recordType, recordClass };
    }

    private static decodeRecord(reader: BEBufferReader, message: Buffer) {
        const name = this.decodeQName(reader, message);
        const recordType = reader.readUInt16();
        const recordClass = reader.readUInt16();
        const ttl = reader.readUInt32();
        const valueLength = reader.readUInt16();
        const valueBytes = reader.readBytes(valueLength);
        const value = this.decodeRecordValue(valueBytes, recordType, message);
        return { name, recordType, recordClass, ttl, value };
    }

    private static decodeQName(reader: BEBufferReader, message: Buffer) {
        const qNameItems = new Array<string>();
        while (true) {
            const itemLength = reader.readUInt8();
            if (itemLength === 0) break;
            if ((itemLength & 0xC0) !== 0) {
                // Compressed Qname
                const indexInMessage = reader.readUInt8() | ((itemLength & 0x3F) << 8);
                qNameItems.push(this.decodeQName(new BEBufferReader(message.slice(indexInMessage)), message));
                break;
            }
            qNameItems.push(reader.readString(itemLength));
        }
        return qNameItems.join(".");
    }

    private static decodeRecordValue(valueBytes: Buffer, recordType: RecordType, message: Buffer) {
        switch (recordType) {
            case RecordType.PTR:
                return this.decodeQName(new BEBufferReader(valueBytes), message);
            case RecordType.SRV:
                return this.decodeSrvRecord(valueBytes, message);
            case RecordType.TXT:
                return this.decodeTxtRecord(valueBytes);
            case RecordType.AAAA:
                return this.decodeAaaaRecord(valueBytes);
            case RecordType.A:
                return this.decodeARecord(valueBytes);
            default:
                // Unknown type, don't decode
                return valueBytes;
        }
    }

    private static decodeSrvRecord(valueBytes: Buffer, message: Buffer): SrvRecordValue {
        const reader = new BEBufferReader(valueBytes);
        const priority = reader.readUInt16();
        const weight = reader.readUInt16();
        const port = reader.readUInt16();
        const target = this.decodeQName(reader, message);
        return { priority, weight, port, target };
    }

    private static decodeTxtRecord(valueBytes: Buffer): string[] {
        const reader = new BEBufferReader(valueBytes);
        const result = new Array<string>();
        var bytesRead = 0;
        while (bytesRead < valueBytes.length) {
            const length = reader.readUInt8();
            result.push(reader.readString(length));
            bytesRead += length + 1;
        }
        return result;
    }

    private static decodeAaaaRecord(valueBytes: Buffer): string {
        const reader = new BEBufferReader(valueBytes);
        const ipItems = new Array<string>();
        for (var i = 0; i < 8; i++) {
            ipItems.push(reader.readUInt16().toString(16));
        }
        // Compress 0 sequences
        const zeroSequences = new Array<{start: number, length: number}>();
        for (var i = 0; i < 8; i++) {
            if (ipItems[i] !== "0") continue;
            const start = i;
            i++;
            while (i < 8 && ipItems[i] === "0") { i++; }
            zeroSequences.push({start, length: i - start});
        }
        if (zeroSequences.length > 0) {
            zeroSequences.sort((a, b) => a.length - b.length);
            const {start, length} = zeroSequences[0];
            for (var i = start; i < start + length; i++) {
                ipItems[i] = "";
            }
        }
        return ipItems.join(":");
    }

    private static decodeARecord(valueBytes: Buffer): string {
        const reader = new BEBufferReader(valueBytes);
        const ipItems = new Array<string>();
        for (var i = 0; i < 4; i++) {
            ipItems.push(reader.readUInt8().toString());
        }
        return ipItems.join(".");
    }

    static encode({transactionId = 0, queries = [], answers = [], authorities = [], additionalRecords = []}: Partial<DnsMessage>): Buffer {
        const buffer = new BEBufferWriter();
        buffer.writeUInt16(transactionId);
        buffer.writeUInt16(queries.length > 0 ? MessageType.Query : MessageType.Response);
        buffer.writeUInt16(0); // No queries
        buffer.writeUInt16(answers.length);
        buffer.writeUInt16(0); // No authority answers
        buffer.writeUInt16(additionalRecords.length);
        queries.forEach(({name, recordClass, recordType}) => {
            buffer.writeBytes(this.encodeQName(name));
            buffer.writeUInt16(recordType);
            buffer.writeUInt16(recordClass);
        });
        [...answers, ...authorities, ...additionalRecords].forEach(({name, recordType, recordClass, ttl, value}) => {
            buffer.writeBytes(this.encodeQName(name));
            buffer.writeUInt16(recordType);
            buffer.writeUInt16(recordClass);
            buffer.writeUInt32(ttl);
            const encodedValue = this.encodeRecordValue(value, recordType);
            buffer.writeUInt16(encodedValue.length);
            buffer.writeBytes(encodedValue);
        });
        return buffer.toBuffer();
    }

    private static encodeRecordValue(value: any, recordType: RecordType): Buffer {
        switch (recordType) {
            case RecordType.PTR:
                return this.encodeQName(value as string);
            case RecordType.SRV:
                return this.encodeSrvRecord(value as SrvRecordValue);
            case RecordType.TXT:
                return this.encodeTxtRecord(value as string[]);
            case RecordType.AAAA:
                return this.encodeAaaaRecord(value as string);
            case RecordType.A:
                return this.encodeARecord(value as string);
            default:
                throw new Error(`Unsupported record type ${recordType}`);
        }
    }

    private static encodeARecord(ip: string) {
        if (!net.isIPv4(ip)) throw new Error(`Invalid A Record value: ${ip}`);
        const buffer = new BEBufferWriter();
        ip.split(".").forEach(part => {
            buffer.writeUInt8(parseInt(part));
        });
        return buffer.toBuffer();
    }

    private static encodeAaaaRecord(ip: string) {
        if (!net.isIPv6(ip)) throw new Error(`Invalid AAAA Record value: ${ip}`);
        const buffer = new BEBufferWriter();
        const parts = ip.split(":");
        parts.forEach(part => {
            if (part === "") {
                const compressedParts = 8 - parts.length;
                for (var i = 0; i < compressedParts; i++) {
                    buffer.writeUInt16(0);
                }
            }
            buffer.writeUInt16(parseInt(part, 16));
        });
        return buffer.toBuffer();
    }

    private static encodeTxtRecord(entries: string[]) {
        const buffer = new BEBufferWriter();
        entries.forEach(entry => {
            buffer.writeUInt8(entry.length);
            buffer.writeString(entry);
        });
        return buffer.toBuffer();
    }

    private static encodeSrvRecord({priority, weight, port, target}: SrvRecordValue) {
        const buffer = new BEBufferWriter();
        buffer.writeUInt16(priority);
        buffer.writeUInt16(weight);
        buffer.writeUInt16(port);
        buffer.writeBytes(this.encodeQName(target));
        return buffer.toBuffer();
    }

    private static encodeQName(qname: string) {
        const buffer = new BEBufferWriter();
        qname.split(".").forEach(label => {
            buffer.writeUInt8(label.length);
            buffer.writeString(label);
        });
        buffer.writeUInt8(0);
        return buffer.toBuffer();
    }
}
