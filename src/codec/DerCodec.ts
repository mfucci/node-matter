export const OBJECT_ID_KEY = "_objectId";
export const END_MARKER = {};

const enum DerType {
    UnsignedInt = 0x02,
    BitString = 0x03,
    OctetString = 0x04,
    ObjectIdentifier = 0x06,
    Sequence = 0x10,
    Set = 0x11,
    UTF8String = 0x0C,
    EndMarker = 0xA0,
}

export class DerCodec {
    static encode(value: any): Buffer {
        if (Array.isArray(value)) {
            return this.encodeArray(value);
        } else if (Buffer.isBuffer(value)) {
            return this.encodeBitString(value);
        } else if (value === END_MARKER) {
            return this.encodeEndMarker();
        } else if (typeof value === "object") {
            return this.encodeObject(value);
        } else if (typeof value === "string") {
            return this.encodeString(value);
        } else if (typeof value === "number") {
            return this.encodeUnsignedInt(value);
        } else {
            throw new Error(`Unsupported type ${typeof value}`);
        }
    }

    private static encodeArray(array: Array<any>) {
        return this.encodeAnsi1(DerType.Set, Buffer.concat(array.map(element => this.encode(element))), true);
    }

    private static encodeBitString(value: Buffer) {
        return this.encodeAnsi1(DerType.BitString, Buffer.concat([Buffer.alloc(1), value]));
    }

    private static encodeEndMarker() {
        return this.encodeAnsi1(DerType.EndMarker, Buffer.alloc(0));
    }

    private static encodeObject(object: any) {
        const attributes = new Array<Buffer>();
        const objectId = object[OBJECT_ID_KEY];
        if (objectId !== undefined) {
            return this.encodeAnsi1(DerType.ObjectIdentifier, objectId);
        }
        for (var key in object) {
            attributes.push(this.encode(object[key]));
        }
        return this.encodeAnsi1(DerType.Sequence, Buffer.concat(attributes), true);
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

    private static encodeAnsi1(tag: number, data: Buffer, constructed: boolean = false) {
        const tagBuffer = Buffer.alloc(1);
        tagBuffer.writeUInt8(tag | (constructed ? 0x20 : 0));
        return Buffer.concat([tagBuffer, this.encodeLengthBytes(data.length), data]);
    }
}
