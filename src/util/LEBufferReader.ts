/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export class LEBufferReader {
    private offset = 0;

    constructor(
        private readonly buffer: Buffer,
    ) {}
    
    readInt8() {
        return this.buffer.readInt8(this.getOffsetAndAdvance(1));
    }

    readInt16() {
        return this.buffer.readInt16LE(this.getOffsetAndAdvance(2));
    }

    readInt32() {
        return this.buffer.readInt32LE(this.getOffsetAndAdvance(4));
    }

    readInt64() {
        return this.buffer.readBigInt64LE(this.getOffsetAndAdvance(8));
    }
    
    readUInt8() {
        return this.buffer.readUInt8(this.getOffsetAndAdvance(1));
    }

    readUInt16() {
        return this.buffer.readUInt16LE(this.getOffsetAndAdvance(2));
    }

    readUInt32() {
        return this.buffer.readUInt32LE(this.getOffsetAndAdvance(4));
    }

    readUInt64() {
        return this.buffer.readBigUInt64LE(this.getOffsetAndAdvance(8));
    }

    readFloat() {
        return this.buffer.readFloatLE(this.getOffsetAndAdvance(4));
    }

    readDouble() {
        return this.buffer.readDoubleLE(this.getOffsetAndAdvance(8));
    }

    readString(size: number) {
        const offset = this.getOffsetAndAdvance(size);
        return this.buffer.toString("utf8", offset, offset + size);
    }

    readBytes(size: number) {
        const offset = this.getOffsetAndAdvance(size);
        return this.buffer.subarray(offset, offset + size);
    }

    getRemainingBytes() {
        return this.buffer.subarray(this.offset);
    }

    getReadBytes() {
        return this.buffer.subarray(0, this.offset);
    }

    private getOffsetAndAdvance(size: number) {
        const result = this.offset;
        this.offset += size;
        return result;
    }
}
