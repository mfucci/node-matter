/**
* @license
* Copyright 2022 The node-matter Authors
* SPDX-License-Identifier: Apache-2.0
*/
import { KeyValueStorage } from "./KeyValueStorage";
import {singleton} from "../util/Singleton";

export class Persistence {
    private storage: KeyValueStorage | undefined;

    static get: () => Persistence = singleton(() => new Persistence());

    init(storage: KeyValueStorage) {
        if (this.storage !== undefined) {
            throw new Error("Persistence already initialized, can not change it on runtime");
        }
        this.storage = storage;
    }

    getPersistenceContext(context: string): PersistenceContext {
        return new PersistenceContext(this, context);
    }

    getStorage(): KeyValueStorage {
        if (this.storage === undefined) {
            throw new Error("Persistence not initialized");
        }
        return this.storage;
    }
}

export class PersistenceContext {
    constructor(
        private readonly persistence: Persistence,
        private readonly context: string
    ) {}

    get(contextKey: string, defaultValue?: any): any | undefined {
        return this.persistence.getStorage().getContextKey(this.context, contextKey, defaultValue);
    }

    getAll(): { key: string, value: any}[] {
        return this.persistence.getStorage().getContextKeys(this.context);
    }

    set(contextKey: string, value: any): void {
        this.persistence.getStorage().setContextKey(this.context, contextKey, value);
    }

    setMultiple(data: { key: string, value: any}[]): void {
        return this.persistence.getStorage().setContextKeys(this.context, data);
    }

    delete(contextKey: string): void {
        this.persistence.getStorage().deleteContextKey(this.context, contextKey);
    }

    deleteAll(): void {
        this.persistence.getStorage().deleteContext(this.context);
    }
}
