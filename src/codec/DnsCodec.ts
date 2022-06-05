import { BEBufferWriter } from "../util/BEBufferWriter";
import net from "net";

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

export interface Record<T> {
    name: string,
    recordType: RecordType,
    recordClass: RecordClass,
    ttl: number,
    value: T,
}

export interface DnsResponse {
    transactionId: number,
    answers: Record<any>[],
    additionalRecords: Record<any>[],
}

const enum RecordType {
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
    static encodeResponse({transactionId, answers, additionalRecords}: DnsResponse): Buffer {
        const buffer = new BEBufferWriter();
        buffer.writeUInt16(transactionId);
        buffer.writeUInt16(0x8000); // Message is a response
        buffer.writeUInt16(0); // No questions
        buffer.writeUInt16(answers.length);
        buffer.writeUInt16(0); // No authoritive answers
        buffer.writeUInt16(additionalRecords.length);
        [...answers, ...additionalRecords].forEach(({name, recordType, recordClass, ttl, value}) => {
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
