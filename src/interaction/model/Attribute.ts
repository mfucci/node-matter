/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";

export class Attribute<T> {
    private value: T;
    private version = 0;
    private template: Template<T>;

    constructor(
        readonly id: number,
        readonly name: string,
        template: Template<T>,
        defaultValue: T,
    ) {
        this.value = defaultValue;
        this.template = template;
    }

    set(value: T) {
        this.version++;
        this.value = value;
    }

    get(): T {
        return this.value;
    }

    getValue() {
        return {
            version: this.version,
            value: TlvObjectCodec.encodeElement(this.value, this.template),
        }
    }
}
