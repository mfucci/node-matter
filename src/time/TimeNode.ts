/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Time } from "./Time";

export class TimeNode extends Time {
    now(): Date {
        return new Date();
    }

    nowMs(): number {
        return this.now().getTime();
    }
}
