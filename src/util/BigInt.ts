/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export function bigintToBuffer(value: bigint) {
    const result = Buffer.alloc(8);
    result.writeBigUInt64BE(value);
    return result;
}