/**
 * Cache computed values or resources for a specified duration to improve performances.
 * 
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export class Cache<T> {
    private readonly values = new Map<string, T>();
    private readonly timestamps = new Map<string, number>();
    private readonly intervalId: NodeJS.Timeout;

    constructor(
        private readonly generator: (...params: string[]) => T,
        private readonly expirationMs: number,
    ) {
        this.intervalId = setInterval(() => this.expire(), expirationMs);
    }

    get(...params: string[]) {
        const key = params.join(",");
        var value = this.values.get(key);
        if (value === undefined) {
            value = this.generator(...params);
            this.values.set(key, value);
        }
        this.timestamps.set(key, Date.now());
        return value;
    }

    clear() {
        this.values.clear();
        this.timestamps.clear();
    }

    close() {
        this.clear();
        clearInterval(this.intervalId);
    }

    private expire() {
        const now = Date.now();
        [...this.timestamps.entries()].forEach(([key, timestamp]) => {
            if (now - timestamp < this.expirationMs) return;
            this.values.delete(key);
            this.timestamps.delete(key);
        });
    }
}
