/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvSchema } from "@project-chip/matter.js";
import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import { AttributeServer } from "./AttributeServer";

export class AttributeGetterServer<T> extends AttributeServer<T> {
    private value: T;
    private version = 0;
    private readonly matterListeners = new Array<(value: T, version: number) => void>();
    private readonly listeners = new Array<(newValue: T, oldValue: T) => void>();

    constructor(
        readonly id: number,
        readonly name: string,
        readonly schema: TlvSchema<T>,
        private readonly validator: (value: T, name: string) => void,
        defaultValue: T,
    ) {
        super(id, name, schema, validator);
    }

    set(session: SecureSession<MatterDevice>, value: T) {
        // TODO: check ACL

        this.setLocal(value);
    }

    setLocal(value: T) {
        const oldValue = this.value;
        if (value !== oldValue) {
            this.validator(value, this.name);
            this.version++;
            this.value = value;
            this.matterListeners.forEach(listener => listener(value, this.version));
        }
        this.listeners.forEach(listener => listener(value, oldValue));
    }

    get(session: SecureSession<MatterDevice>): T {
        // TODO: check ACL

        return this.getLocal();
    }

    getLocal(): T {
        return this.value;
    }

    getWithVersion(session: SecureSession<MatterDevice>) {
        // TODO: check ACL

        return this.getWithVersionLocal();
    }

    getWithVersionLocal() {
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
