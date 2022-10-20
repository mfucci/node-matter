/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template } from "../../../codec/TlvObjectCodec";

export class AttributeServer<T> {
    private value: T;
    private version = 0;
    private readonly listeners = new Array<(value: T, version: number) => void>();

    constructor(
        readonly id: number,
        readonly name: string,
        readonly template: Template<T>,
        defaultValue: T,
    ) {
        this.value = defaultValue;
    }

    set(value: T) {
        if (value === this.value) return;

        this.version++;
        this.value = value;
        this.listeners.forEach(listener => listener(value, this.version));
    }

    get(): T {
        return this.value;
    }

    getWithVersion() {
        return { version: this.version, value: this.value };
    }

    addListener(listener: (value: T, version: number) => void) {
        this.listeners.push(listener);
    }

    removeListener(listener: (value: T, version: number) => void) {
        this.listeners.splice(this.listeners.findIndex(item => item === listener), 1);
    }
}
