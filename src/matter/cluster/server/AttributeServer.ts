/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template } from "../../../codec/TlvObjectCodec";

export class AttributeServer<T> {
    private value: T;
    private version = 0;
    private readonly listeners = new Map<number, (value: T) => void>();

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

        if (this.listeners.size !== 0) {
            [...this.listeners.values()].forEach(listener => listener(value))
        } 
    }

    get(): T {
        return this.value;
    }

    getWithVersion() {
        return { version: this.version, value: this.value };
    }

    addListener(id: number, listener: (value: T) => void) {
        this.listeners.set(id, listener);
    }

    removeListener(id: number) {
        this.listeners.delete(id);
    }
}
