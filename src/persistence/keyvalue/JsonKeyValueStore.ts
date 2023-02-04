/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { NoStorageMapKeyValueStore } from "./NoStorageMapKeyValueStore";

interface StorageEntry {
    key: string;
    value: any;
}

export class JsonNoStorageMapKeyValueStore extends NoStorageMapKeyValueStore {

    toJsonString(): string {
        return JSON.stringify([...this.data].map(([key, value]) => ( { key, value })), (key, value) => {
            if (typeof value === 'bigint') {
                return `bigint(${value})`;
            }
            if (typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
                return `Buffer(${Buffer.from(value.data).toString('base64')})`;
            }
            if (value instanceof Uint8Array) {
                return `Uint8Array(${Buffer.from(value).toString('base64')})`;
            }
            return value;
        });
    }

    fromJsonString(json: string): void {
        const mapData = JSON.parse(json, (key, value) => {
            if (typeof value === 'string' && value.startsWith('bigint(') && value.endsWith(')')) {
                return BigInt(value.slice(7, -1));
            }
            if (typeof value === 'string' && value.startsWith('Buffer(') && value.endsWith(')')) {
                return Buffer.from(value.slice(7, -1), 'base64');
            }
            if (typeof value === 'string' && value.startsWith('Uint8Array(') && value.endsWith(')')) {
                return new Uint8Array(Buffer.from(value.slice(11, -1), 'base64'));
            }
            return value;
        }) as StorageEntry[];
        console.log('decoded:', mapData);
        mapData.forEach(entry => this.data.set(entry.key, entry.value));
    }

}
