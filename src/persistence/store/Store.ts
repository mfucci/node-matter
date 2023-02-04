/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Store {
    open(): Promise<void>;
    close(): Promise<void>;
    persistData(): Promise<void>;
}
