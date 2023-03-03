/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Storage } from "./Storage";

export class StorageInMemory implements Storage {
    protected store: any = {};

    async initialize() {}

    async close() {}

    get<T>(context: string, key: string): T | undefined {
        return this.store[context]?.[key];
    }

    getAll(context: string): { key: string, value: any}[] {
        const contextStore = this.store[context];
        if (contextStore === undefined) return [];
        return Object.keys(contextStore).map(key => ({ key, value: contextStore[key] }));
    }

    set<T>(context: string, key: string, value: T): void {
        let contextStore = this.store[context];
        if (contextStore === undefined) {
            contextStore = {};
            this.store[context] = contextStore;
        }
        contextStore[key] = value;
    }
}
