/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ClassExtends } from "../util/Type";

type ErrorHandler<T> = (error: Error) => T;

/**
 * Try to execute the code block and catch the error if it is of the given type.
 * If the error is of the given type, the fallback value or the result of the function is returned.
 * If the function returns undefined or the error type do not match, the error is normally thrown and not handled.
 *
 * @param codeBlock Code block to execute
 * @param errorType Errortype to catch and handle
 * @param fallbackValueOrFunction Fallback value or function to compute the fallback value
 */
export function tryCatch<T>(codeBlock: () => T, errorType: ClassExtends<Error>, fallbackValueOrFunction: ErrorHandler<T> | T): T {
    try {
        return codeBlock();
    } catch (error) {
        if (error instanceof errorType) {
            if (typeof fallbackValueOrFunction === "function") {
                return (fallbackValueOrFunction as ErrorHandler<T>)(error);
            } else {
                return fallbackValueOrFunction;
            }
        }
        throw error;
    }
}

/**
 * Try to execute the async code block and catch the error if it is of the given type.
 * If the error is of the given type, the fallback value or the result of the function is returned.
 * If the function returns undefined or the error type do not match, the error is normally thrown and not handled.
 *
 * @param codeBlock Async code block to execute
 * @param errorType Errortype to catch and handle
 * @param fallbackValueOrFunction Fallback value or function to compute the fallback value
 */
export async function tryCatchAsync<T>(codeBlock: () => Promise<T>, errorType: ClassExtends<Error>, fallbackValueOrFunction: ErrorHandler<T> | T): Promise<T> {
    try {
        return await codeBlock();
    } catch (error) {
        if (error instanceof errorType) {
            if (typeof fallbackValueOrFunction === "function") {
                return (fallbackValueOrFunction as ErrorHandler<T>)(error);
            } else {
                return fallbackValueOrFunction;
            }
        }
        throw error;
    }
}
