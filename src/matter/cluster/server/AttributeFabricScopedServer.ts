/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvSchema } from "@project-chip/matter.js";
import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import { AttributeServer } from "./AttributeServer";

export class AttributeFabricScopedServer<T> extends AttributeServer<T> {
    private scopedValues = new Map<number, T>();

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
}
