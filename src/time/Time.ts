/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export abstract class Time {
    static get: () => Time = () => { throw new Error("No provider configured"); };

    abstract now(): Date;
    abstract nowMs(): number;

    /** Returns a timer that will call callback after durationMs has passed. */
    abstract getTimer(durationMs: number, callback: () => void): Timer;

    /** Returns a timer that will periodically call callback at intervalMs intervals. */
    abstract getPeriodicTimer(intervalMs: number, callback: () => void): Timer;
}

export interface Timer {
    /** Restarts the countdown or the timer if it has been cancelled. */
    restart(): void;

    /** Cancels this timer. It can be reset to restart it. */
    cancel(): void;
}
