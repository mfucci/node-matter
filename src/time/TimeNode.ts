/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Time, Timer } from "./Time";

class TimerNode implements Timer {
    private timerId: NodeJS.Timer | undefined;
    private callCount: number = 0;

    constructor(
            private readonly intervalMs: number,
            private readonly callback: () => void,
            private readonly periodic: boolean,
        ) {}

    start(): void {
        this.timerId = (this.periodic ? setInterval : setTimeout)(this.callback, this.intervalMs);
    }

    stop(): void {
        (this.periodic ? clearInterval : clearTimeout)(this.timerId);
    }
}

export class TimeNode extends Time {
    now(): Date {
        return new Date();
    }

    nowMs(): number {
        return this.now().getTime();
    }

    getTimer(durationMs: number, callback: () => void): Timer {
        return new TimerNode(durationMs, callback, false);
    }

    getPeriodicTimer(intervalMs: number, callback: () => void): Timer {
        return new TimerNode(intervalMs, callback, true);
    }   
}
