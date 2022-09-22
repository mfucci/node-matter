export function bigintToBuffer(value: bigint) {
    const result = Buffer.alloc(8);
    result.writeBigUInt64BE(value);
    return result;
}