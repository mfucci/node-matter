/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Schema, ByteArray, MatterCoreSpecificationV1_0 } from "@project-chip/matter.js";

const BASE38_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-.";

/** See {@link MatterCoreSpecificationV1_0} § 5.1.3.1 */
class Base38Schema extends Schema<ByteArray, string> {
    protected encodeInternal(bytes: ByteArray): string {
        const length = bytes.length;
        let offset = 0;
        const result = new Array<string>();
        while (offset < length) {
            const remaining = length - offset;
            if (remaining > 2) {
                result.push(this.encodeBase38(bytes[offset++] | (bytes[offset++] << 8) | (bytes[offset++] << 16), 5));
            } else if (remaining == 2) {
                result.push(this.encodeBase38(bytes[offset++] | (bytes[offset++] << 8), 4));
                break;
            } else {
                result.push(this.encodeBase38(bytes[offset++], 2));
                break;
            }
        }
        return result.join("");
    }

    private encodeBase38(value: number, charCount: number) {
        let result = "";
        for (let i = 0; i < charCount; i++) {
            const remainder = value % 38;
            result += BASE38_ALPHABET[remainder];
            value = (value - remainder) / 38;
        }
        return result;
    }

    protected decodeInternal(encoded: string): ByteArray {
        const encodedLength = encoded.length;
        const remainderEncodedLength = encodedLength % 5;
        let decodeLength = ((encodedLength - remainderEncodedLength) / 5) * 3;
        switch (remainderEncodedLength) {
            case 4:
                decodeLength += 2;
                break;
            case 2:
                decodeLength += 1;
                break;
            default:
                throw new Error(`Invalid base38 encoded string length: ${encodedLength}`);
        }
        const result = new ByteArray(decodeLength);
        let decodedOffset = 0;
        let encodedOffset = 0;
        while (encodedOffset < encodedLength) {
            const remaining = encodedLength - encodedOffset;
            if (remaining > 5) {
                const value = this.decodeBase38(encoded, encodedOffset, 5);
                result[decodedOffset++] = value & 0xFF;
                result[decodedOffset++] = (value >> 8) & 0xFF;
                result[decodedOffset++] = (value >> 16) & 0xFF;
                encodedOffset += 5;
            } else if (remaining == 4) {
                const value = this.decodeBase38(encoded, encodedOffset, 4);
                result[decodedOffset++] = value & 0xFF;
                result[decodedOffset++] = (value >> 8) & 0xFF;
                break;
            } else {
                const value = this.decodeBase38(encoded, encodedOffset, 2);
                result[decodedOffset++] = value & 0xFF;
                break;
            }
        }
        return result;
    }

    private decodeBase38(encoded: string, offset: number, charCount: number) {
        let result = 0;
        for (let i = charCount - 1; i >= 0; i--) {
            const char = encoded[offset + i];
            // TODO: replace this with a lookup table for performance
            const code = BASE38_ALPHABET.indexOf(char);
            if (code === -1) throw new Error(`Unexpected character ${char} at ${offset + i}`);
            result = result * 38 + code;
        }
        return result;
    }
}

export const Base38 = new Base38Schema();
