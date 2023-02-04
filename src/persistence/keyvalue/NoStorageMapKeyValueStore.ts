/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { KeyValueHandler } from "./KeyValueHandler";

export class NoStorageMapKeyValueStore implements KeyValueHandler {
    protected data = new Map<string, any>();

    constructor() {}

    private buildKeyString(context: string, contextKey: string): string {
        return `${context}$$${contextKey}`;
    }

    getContextKey(context: string, contextKey: string, defaultValue: any): any | undefined {
        const value = this.data.get(this.buildKeyString(context, contextKey));
        if (value === undefined) {
            return defaultValue;
        }
        return value;
    }

    getContextKeys(context: string): { key: string, value: any}[] {
return [...this.data]
    .filter(([key]) => key.startsWith(`${context}$$`))
    .map(([key, value]) => ({ key: key.substring(context.length + 1), value }));
    }

    setContextKey(context: string, contextKey: string, value: any): void {
        this.data.set(this.buildKeyString(context, contextKey), value);
    }

    setContextKeys(context: string, data: { key: string, value: any}[]): void {
        data.forEach((item) => this.data.set(this.buildKeyString(context, item.key), item.value));
    }

    deleteContextKey(context: string, contextKey: string): void {
        this.data.delete(this.buildKeyString(context, contextKey));
    }

    deleteContext(context: string): void {
        const keys = Array.from(this.data.keys());
        keys.filter((key) => key.startsWith(`${context}$$`)).forEach((key) => this.data.delete(key));
    }

}
