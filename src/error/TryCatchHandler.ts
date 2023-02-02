/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

type ErrorHandler<T> = (error: Error) => T | undefined;

export function tryCatch<T>(codeBlock: () => T, errorType: {new (message?: string): Error}, fallbackValueOrFunction: ErrorHandler<T> | T): T {
    try {
        return codeBlock();
    } catch (error) {
        if (error instanceof Error && error instanceof errorType) {
            if (typeof fallbackValueOrFunction === "function") {
                const computedFallbackValue = (fallbackValueOrFunction as ErrorHandler<T>)(error);
                if (computedFallbackValue !== undefined) return computedFallbackValue;
            } else {
                return fallbackValueOrFunction;
            }
        }
        throw error;
    }
}

export async function tryCatchAsync<T>(codeBlock: () => Promise<T>, errorType: {new (message?: string): Error}, fallbackValueOrFunction: ErrorHandler<T> | T): Promise<T> {
    try {
        return await codeBlock();
    } catch (error) {
        if (error instanceof errorType) {
            if (typeof fallbackValueOrFunction === "function") {
                const computedFallbackValue = (fallbackValueOrFunction as ErrorHandler<T>)(error);
                if (computedFallbackValue !== undefined) return computedFallbackValue;
            } else {
                return fallbackValueOrFunction;
            }
        }
        throw error;
    }
}
