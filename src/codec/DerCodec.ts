/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { BEBufferReader } from "../util/BEBufferReader";

export const OBJECT_ID_KEY = "_objectId";
export const TAG_ID_KEY = "_tag";
export const BYTES_KEY = "_bytes";
export const ELEMENTS_KEY = "_elements";
export const BITS_PADDING = "_padding";

const enum DerType {
    Boolean = 0x01,
    UnsignedInt = 0x02,
    BitString = 0x03,
    OctetString = 0x04,
    ObjectIdentifier = 0x06,
    UTF8String = 0x0C,
    Sequence = 0x10,
    Set = 0x11,
    UtcDate = 0x17,
}

const CONSTRUCTED = 0x20;

const enum DerClass {
    Universal = 0x00,
    Application = 0x40,
    ContextSpecific = 0x80,
    Private = 0xC0,
}
export const ObjectId = (objectId: string) => ({ [TAG_ID_KEY]: DerType.ObjectIdentifier as number, [BYTES_KEY]: Buffer.from(objectId, "hex") });
export const DerObject = (objectId: string, content: any = {}) => ({ [OBJECT_ID_KEY]: ObjectId(objectId), ...content });
export const BitBuffer = (data: Buffer, padding: number = 0) => ({ [TAG_ID_KEY]: DerType.BitString as number, [BYTES_KEY]: data, [BITS_PADDING]: padding });
export const ContextTagged = (tagId: number, value?: any) => ({ [TAG_ID_KEY]: tagId | DerClass.ContextSpecific | CONSTRUCTED, [BYTES_KEY]: value === undefined ? Buffer.alloc(0) : DerCodec.encode(value) });
export const ContextTaggedBytes = (tagId: number, value: Buffer) => ({ [TAG_ID_KEY]: tagId | DerClass.ContextSpecific, [BYTES_KEY]: value });


export type DerNode = {
    [TAG_ID_KEY]: number,
    [BYTES_KEY]: Buffer,
    [ELEMENTS_KEY]?: DerNode[],
    [BITS_PADDING]?: number,
}

export class DerCodec {
    static encode(value: any): Buffer {
        if (Array.isArray(value)) {
            return this.encodeArray(value);
        } else if (Buffer.isBuffer(value)) {
            return this.encodeOctetString(value);
        } else if (value instanceof Date) {
            return this.encodeDate(value);
        } else if (typeof value === "object" && value[TAG_ID_KEY] !== undefined) {
            return this.encodeAnsi1(value[TAG_ID_KEY], (value[BITS_PADDING] === undefined) ? value[BYTES_KEY] : Buffer.concat([Buffer.alloc(1, value[BITS_PADDING]), value[BYTES_KEY]]));
        } else if (typeof value === "object") {
            return this.encodeObject(value);
        }else if (typeof value === "string") {
            return this.encodeString(value);
        } else if (typeof value === "number") {
            return this.encodeUnsignedInt(value);
        } else if (typeof value === "boolean") {
            return this.encodeBoolean(value);
        } else {
            throw new Error(`Unsupported type ${typeof value}`);
        }
    }

    private static encodeDate(date: Date) {
        return this.encodeAnsi1(DerType.UtcDate, Buffer.from(date.toISOString().replace(/[-:\.T]/g, "").slice(2, 14) + "Z"));
    }

    private static encodeBoolean(bool: boolean) {
        return this.encodeAnsi1(DerType.Boolean, Buffer.alloc(1, bool ? 0xFF : 0));
    }

    private static encodeArray(array: Array<any>) {
        return this.encodeAnsi1(DerType.Set | CONSTRUCTED, Buffer.concat(array.map(element => this.encode(element))));
    }

    private static encodeOctetString(value: Buffer) {
        return this.encodeAnsi1(DerType.OctetString, value);
    }

    private static encodeObject(object: any) {
        const attributes = new Array<Buffer>();
        for (var key in object) {
            attributes.push(this.encode(object[key]));
        }
        return this.encodeAnsi1(DerType.Sequence | CONSTRUCTED, Buffer.concat(attributes));
    }

    private static encodeString(value: string) {
        return this.encodeAnsi1(DerType.UTF8String, Buffer.from(value));
    }

    private static encodeUnsignedInt(value: number) {
        const buffer = Buffer.alloc(5);
        buffer.writeUInt32BE(value, 1);
        var start = 0;
        while (true) {
            if (buffer.readUint8(start) !== 0) break;
            if (buffer.readUint8(start + 1) >= 0x80) break;
            start++;
            if (start === 4) break;
        }
        return this.encodeAnsi1(DerType.UnsignedInt, buffer.slice(start));
    }

    private static encodeLengthBytes(value: number) {
        const buffer = Buffer.alloc(5);
        buffer.writeUInt32BE(value, 1);
        var start = 0;
        while (true) {
            if (buffer.readUint8(start) !== 0) break;
            start++;
            if (start === 4) break;
        }
        const lengthLength = buffer.length - start;
        if (lengthLength > 1 || buffer.readUint8(start) >= 0x80) {
            start--;
            buffer.writeUInt8(0x80 + lengthLength, start);
        }
        return buffer.slice(start);
    }

    private static encodeAnsi1(tag: number, data: Buffer) {
        const tagBuffer = Buffer.alloc(1);
        tagBuffer.writeUInt8(tag);
        return Buffer.concat([tagBuffer, this.encodeLengthBytes(data.length), data]);
    }

    static decode(data: Buffer): DerNode {
        return this.decodeRec(new BEBufferReader(data));
    }

    private static decodeRec(reader: BEBufferReader): DerNode {
        const { tag, bytes } = this.decodeAnsi1(reader);
        if (tag === DerType.BitString) return { [TAG_ID_KEY]: tag, [BYTES_KEY]: bytes.slice(1), [BITS_PADDING]: bytes[0] };
        if ((tag & CONSTRUCTED) === 0) return { [TAG_ID_KEY]: tag, [BYTES_KEY]: bytes };
        const elementsReader = new BEBufferReader(bytes);
        const elements = [];
        while (elementsReader.getRemainingBytesCount() > 0) {
            elements.push(this.decodeRec(elementsReader));
        }
        return { [TAG_ID_KEY]: tag, [BYTES_KEY]: bytes, [ELEMENTS_KEY]: elements };
    }

    private static decodeAnsi1(reader: BEBufferReader): { tag: number, bytes: Buffer } {
        const tag = reader.readUInt8();
        let length = reader.readUInt8();
        if ((length & 0x80) !== 0) {
            let lengthLength = length & 0x7F;
            length = 0;
            while (lengthLength > 0) {
                length = (length << 8) + reader.readUInt8();
                lengthLength--;
            }
        }
        const bytes = reader.readBytes(length);
        return { tag, bytes };
    }
}

export const PublicKeyEcPrime256v1_X962 = (key: Buffer) => ({ type: { algorithm: ObjectId("2A8648CE3D0201") /* EC Public Key */, curve: ObjectId("2A8648CE3D030107") /* Curve P256_V1 */ }, bytes: BitBuffer(key) });
export const EcdsaWithSHA256_X962 = DerObject("2A8648CE3D040302");
export const OrganisationName_X520 = (name: string) => [ DerObject("55040A", { name }) ];
export const SubjectKeyIdentifier_X509 = (identifier: Buffer) => DerObject("551d0e", { value: DerCodec.encode(identifier) });
export const AuthorityKeyIdentifier_X509 = (identifier: Buffer) => DerObject("551d23", { value: DerCodec.encode({ id: ContextTaggedBytes(0, identifier) }) });
export const BasicConstraints_X509 = (constraints: any) => DerObject("551d13", { critical: true, value: DerCodec.encode(constraints) })
export const ExtendedKeyUsage_X509 = ({clientAuth, serverAuth}: {clientAuth: boolean, serverAuth: boolean}) => DerObject("551d25", { critical: true, value: DerCodec.encode({
        client: clientAuth ? ObjectId("2b06010505070302") : undefined,
        server: serverAuth ? ObjectId("2b06010505070301") : undefined,
    })});
export const KeyUsage_Signature_X509 = DerObject("551d0f", { critical: true, value: DerCodec.encode(BitBuffer(Buffer.from([ 1 << 7]), 7)) });
export const KeyUsage_Signature_ContentCommited_X509 = DerObject("551d0f", { critical: true, value: DerCodec.encode(BitBuffer(Buffer.from([ 0x03 << 1]), 1)) });
