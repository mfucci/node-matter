/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KeyValueHandler {
    getContextKey(context: string, contextKey: string, defaultValue: any): any | undefined;
    getContextKeys(context: string): any[];
    setContextKey(context: string, contextKey: string, value: any): void;
    setContextKeys(context: string, data: { key: string, value: any}[]): void;
    deleteContextKey(context: string, contextKey: string): void;
    deleteContext(context: string): void;
}
