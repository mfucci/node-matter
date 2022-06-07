/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export class LEBufferWriter {
    private readonly chunks = new Array<Buffer>();
    
    writeInt8(value: number) {
        const buffer = Buffer.alloc(1);
        buffer.writeInt8(value);
        this.chunks.push(buffer);
    }

    writeInt16(value: number) {
        const buffer = Buffer.alloc(2);
        buffer.writeInt16LE(value);
        this.chunks.push(buffer);
    }

    writeInt32(value: number) {
        const buffer = Buffer.alloc(4);
        buffer.writeInt32LE(value);
        this.chunks.push(buffer);
    }

    writeInt64(value: bigint) {
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64LE(value);
        this.chunks.push(buffer);
    }
    
    writeUInt8(value: number) {
        const buffer = Buffer.alloc(1);
        buffer.writeUInt8(value);
        this.chunks.push(buffer);
    }

    writeUInt16(value: number) {
        const buffer = Buffer.alloc(2);
        buffer.writeUInt16LE(value);
        this.chunks.push(buffer);
    }

    writeUInt32(value: number) {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32LE(value);
        this.chunks.push(buffer);
    }

    writeUInt64(value: bigint) {
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64LE(value);
        this.chunks.push(buffer);
    }

    writeFloat(value: number) {
        const buffer = Buffer.alloc(4);
        buffer.writeFloatLE(value);
        this.chunks.push(buffer);
    }

    writeDouble(value: number) {
        const buffer = Buffer.alloc(8);
        buffer.writeDoubleLE(value);
        this.chunks.push(buffer);
    }

    writeString(value: string) {
        this.chunks.push(Buffer.from(value));
    }

    writeBytes(value: Buffer) {
        this.chunks.push(value);
    }

    toBuffer() {
        return Buffer.concat(this.chunks);
    }
}
