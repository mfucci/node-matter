/**
* @license
* Copyright 2022 The node-matter Authors
* SPDX-License-Identifier: Apache-2.0
*/

import { Storage } from "./Storage";

export class Persistence {
    constructor(
        private readonly storage: Storage,
        private readonly context: string
    ) {}

    get<T>(key: string, defaultValue?: T): T | undefined {
        const value = this.storage.get<T>(this.context, key);
        if (value !== undefined) return value;
        return defaultValue;
    }

    getAll(): { key: string, value: any}[] {
        return this.storage.getAll(this.context);
    }

    set<T>(key: string, value: T): void {
        this.storage.set(this.context, key, value);
    }
}
