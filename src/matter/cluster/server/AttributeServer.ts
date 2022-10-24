/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template } from "../../../codec/TlvObjectCodec";

export class AttributeServer<T> {
    private value: T;
    private version = 0;
    private readonly matterListeners = new Array<(value: T, version: number) => void>();
    private readonly listeners = new Array<(newValue: T, oldValue: T) => void>();

    constructor(
        readonly id: number,
        readonly name: string,
        readonly template: Template<T>,
        defaultValue: T,
    ) {
        this.value = defaultValue;
    }

    set(value: T) {
        if (value === this.value) {
            this.listeners.forEach(listener => listener(value, value));
            return;
        }

        const oldValue = this.value;
        this.version++;
        this.value = value;
        this.listeners.forEach(listener => listener(value, oldValue));
        this.matterListeners.forEach(listener => listener(value, this.version));
    }

    get(): T {
        return this.value;
    }

    getWithVersion() {
        return { version: this.version, value: this.value };
    }

    addMatterListener(listener: (value: T, version: number) => void) {
        this.matterListeners.push(listener);
    }

    removeMatterListener(listener: (value: T, version: number) => void) {
        this.matterListeners.splice(this.matterListeners.findIndex(item => item === listener), 1);
    }

    addListener(listener: (newValue: T, oldValue: T) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (newValue: T, oldValue: T) => void) {
        this.listeners.splice(this.listeners.findIndex(item => item === listener), 1);
    }
}
