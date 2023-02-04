/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from "fs";
import { JsonNoStorageMapKeyValueStore } from "../keyvalue/JsonKeyValueStore";
import { Store } from "./Store";
import { Time, Timer } from "../../time/Time";

const STORAGE_DELAY_DEFAULT = 1000;

interface StorageOptions {
    /**
     * Number of milliseconds to delay storing the data into the file to prevent storing too much when
     * multiple data are set in a short time. Use -1 to only manually store the data by using "persistData".
     * The default delay if not set is 1s
     */
    storageDelay?: number;
}

export class NodeFsJsonKeyValueStore extends JsonNoStorageMapKeyValueStore implements Store {
    private opened = false;

    private storageTimer: Timer | null = null;

    constructor(
        private readonly filePath: string,
        private readonly options: StorageOptions = {}
    ) {
        super();
        if (this.options.storageDelay === undefined || this.options.storageDelay < -1) {
            this.options.storageDelay = STORAGE_DELAY_DEFAULT;
        }
    }

    scheduleDataStorage(): void {
        if (this.storageTimer || this.options.storageDelay === -1) {
            return;
        }

        this.storageTimer = Time.getTimer(this.options.storageDelay || STORAGE_DELAY_DEFAULT, () => this.persistData()).start();
    }

    getContextKey(context: string, contextKey: string, defaultValue: any): any | undefined {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        return super.getContextKey(context, contextKey, defaultValue);
    }

    getContextKeys(context: string): any[] {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        return super.getContextKeys(context);
    }

    setContextKey(context: string, contextKey: string, value: any): void {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        super.setContextKey(context, contextKey, value);
        this.scheduleDataStorage();
    }

    setContextKeys(context: string, data: { key: string, value: any}[]): void {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        super.setContextKeys(context, data);
        this.scheduleDataStorage();
    }

    deleteContextKey(context: string, contextKey: string): void {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        super.deleteContextKey(context, contextKey);
        this.scheduleDataStorage();
    }

    deleteContext(context: string): void {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
        super.deleteContext(context);
        this.scheduleDataStorage();
    }

    async open(): Promise<void> {
        this.opened = true;

        if (fs.existsSync(this.filePath)) {
            const content = fs.readFileSync(this.filePath, 'utf-8');
            this.fromJsonString(content);
        }
    }

    async close(): Promise<void> {
        if (!this.opened) {
            return;
        }
        await this.persistData();
        this.opened = false;
    }

    async persistData(): Promise<void> {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }

        if (this.storageTimer) {
            this.storageTimer.stop();
            this.storageTimer = null;
        }

        const data = this.toJsonString();
        fs.writeFileSync(this.filePath, data, 'utf-8');
    }
}
