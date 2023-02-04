/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { JsonNoStorageMapKeyValueStore } from "../keyvalue/JsonKeyValueStore";
import { Store } from "./Store";
import {KeyValueHandler} from "../keyvalue/KeyValueHandler";

export class FakeJsonKeyValueStore extends JsonNoStorageMapKeyValueStore implements KeyValueHandler, Store {
    private opened = false;

    async open(): Promise<void> {
        this.opened = true;
    }

    async close(): Promise<void> {
        if (!this.opened) {
            return;
        }
        this.opened = false;
    }

    async persistData(): Promise<void> {
        if (!this.opened) {
            throw new Error("The KeyValueStore is not open");
        }
    }

    public isOpened(): boolean {
        return this.opened;
    }

    public getData(): Map<string, any> {
        return this.data;
    }
}
