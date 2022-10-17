/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export class BEBufferReader {
    private offset = 0;

    constructor(
        private readonly buffer: Buffer,
    ) {}
    
    readInt8() {
        return this.buffer.readInt8(this.getOffsetAndAdvance(1));
    }

    readInt16() {
        return this.buffer.readInt16BE(this.getOffsetAndAdvance(2));
    }

    readInt32() {
        return this.buffer.readInt32BE(this.getOffsetAndAdvance(4));
    }

    readInt64() {
        return this.buffer.readBigInt64BE(this.getOffsetAndAdvance(8));
    }
    
    readUInt8() {
        return this.buffer.readUInt8(this.getOffsetAndAdvance(1));
    }

    readUInt16() {
        return this.buffer.readUInt16BE(this.getOffsetAndAdvance(2));
    }

    readUInt32() {
        return this.buffer.readUInt32BE(this.getOffsetAndAdvance(4));
    }

    readUInt64() {
        return this.buffer.readBigUInt64BE(this.getOffsetAndAdvance(8));
    }

    readFloat() {
        return this.buffer.readFloatBE(this.getOffsetAndAdvance(4));
    }

    readDouble() {
        return this.buffer.readDoubleBE(this.getOffsetAndAdvance(8));
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

    getRemainingBytesCount() {
        return this.buffer.length - this.offset;
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
