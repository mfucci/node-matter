/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export abstract class Time {
    static get: () => Time = () => { throw new Error("No provider configured"); };

    abstract now(): Date;
    abstract nowMs(): number;
}