/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Time } from "../time/Time";
import { Storage } from "./Storage";
import { readFile, writeFile } from "fs/promises";
import { Logger } from "../log/Logger";
import { ByteArray } from "@project-chip/matter.js";
import {StorageInMemory} from "./StorageInMemory";

/** We store changes 1s after a value was set to the storage, but not more often than every 1s. */
const COMMIT_DELAY = 1000 /* 1s */;

const logger = Logger.get("StorageNode");

export class StorageNode extends StorageInMemory {
    private readonly commitTimer = Time.getTimer(COMMIT_DELAY, () => this.commit());
    private waitForCommit = false;
    private allowToCommit = false;

    constructor(
        private readonly path: string,
    ) {
        super();
    }

    async initialize() {
        if (Object.keys(this.store).length > 0) {
            throw new Error("Storage contains already values, can not initialize!");
        }
        try {
            this.store = this.fromJson(await readFile(this.path, "utf-8"));
        } catch (error: any) {
            if (error.code !== "ENOENT") {
                throw error;
            }
        }
        this.allowToCommit = true;
    }

    set<T>(context: string, key: string, value: T): void {
        super.set(context, key, value);
        if (!this.waitForCommit) {
            this.waitForCommit = true;
            this.commitTimer.start();
        }
    }

    private async commit() {
        if (!this.allowToCommit) return;
        this.waitForCommit = false;
        try {
            await writeFile(this.path, this.toJson(this.store), "utf-8");
        } catch (error) {
            logger.error("Failed to write storage file", error);
        }
    }

    async close() {
        this.commitTimer.stop();
        await this.commit();
        this.allowToCommit = false;
    }

    private toJson(object: any): string {
        return JSON.stringify(object, (_key, value) => {
            if (typeof value === 'bigint') {
                return `{"__object__":"BigInt","__value__":"${value.toString()}"}`;
            }
            if (typeof value === 'object' && value.type === 'Buffer' && Array.isArray(value.data)) {
                return `{"__object__":"Buffer","__value__":"${Buffer.from(value.data).toString('base64')}"}`;
            }
            if (value instanceof Uint8Array) {
                return `{"__object__":"Uint8Array","__value__":"${Buffer.from(value).toString('base64')}"}`;
            }
            return value;
        }, " ");
    }

    private fromJson(json: string): any {
        return JSON.parse(json, (_key, value) => {
            if (typeof value === "string" && value.startsWith('{"__object__":"') && value.endsWith('"}')) {
                const data = JSON.parse(value);
                const object = data.__object__;
                switch (object) {
                    case "BigInt":
                        return BigInt(data.__value__);
                    case "Buffer":
                        return Buffer.from(data.__value__, 'base64');
                    case "Uint8Array":
                        return new Uint8Array(Buffer.from(data.__value__, 'base64'));
                    default:
                        throw new Error(`Unknown object type: ${object}`);
                }
            }
            return value;
        });
    }
}
