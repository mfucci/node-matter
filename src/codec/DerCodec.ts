export const OBJECT_ID_KEY = "_objectId";

const enum DerType {
    UnsignedInt = 0x02,
    BitString = 0x03,
    OctetString = 0x04,
    ObjectIdentifier = 0x06,
    Sequence = 0x10,
    Set = 0x11,
    UTF8String = 0x0C,
}

export class DerCodec {
    static encode(value: any): Buffer {
        if (Array.isArray(value)) {
            return this.encodeArray(value);
        } else if (Buffer.isBuffer(value)) {
            return this.encodeBitString(value);
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
        return this.encodeAnsi1(DerType.BitString, value);
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
        return this.encodeAnsi1(DerType.UnsignedInt, this.encodeUnsignedIntBytes(value));
    }

    private static encodeUnsignedIntBytes(value: number) {
        const buffer = Buffer.alloc(5);
        buffer.writeUInt32BE(value, 1);
        var start = 0;
        while (true) {
            if (buffer.readUint8(start) !== 0) break;
            if (buffer.readUint8(start + 1) >= 0x80) break;
            start++;
            if (start === 4) break;
        }
        return buffer.slice(start);
    }

    private static encodeAnsi1(tag: number, data: Buffer, constructed: boolean = false) {
        const tagBuffer = Buffer.alloc(1);
        tagBuffer.writeUInt8(tag | (constructed ? 0x20 : 0));
        const lengthBuffer = this.encodeUnsignedIntBytes(data.length);
        if (lengthBuffer.length > 1) {
            const lengthLengthBuffer = Buffer.alloc(1);
            lengthLengthBuffer.writeUInt8(0x80 + lengthBuffer.length);
            return Buffer.concat([tagBuffer, lengthLengthBuffer, lengthBuffer, data]);
        } else {
            return Buffer.concat([tagBuffer, lengthBuffer, data]);
        }
    }
}
