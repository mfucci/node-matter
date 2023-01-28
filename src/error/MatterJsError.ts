/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Used to identify errors cases from this library.
 */
export enum MatterJsErrorCodes {
    FabricNotFound = "fabric-not-found",
}

export class MatterJsError extends Error {
    public constructor(
        public readonly message: string,
        public readonly code: MatterJsErrorCodes,
        /** Additional information about which component/class generated the error. */
        public readonly context?: string,
        public readonly contextData: Record<string, unknown> = {}
    ) {
        super();

        // Add the error code to the message to be able to identify it even when the stack trace is garbled somehow
        this.message = `${context ? `${context} ` : ''}(${this.code}): ${this.message}`;

        // We need to set the prototype explicitly
        Object.setPrototypeOf(this, MatterJsError.prototype);
        Object.getPrototypeOf(this).name = "MatterJsError";
    }
}

export function isMatterJsError(e: unknown): e is MatterJsError {
    return e instanceof Error && Object.getPrototypeOf(e).name === "MatterJsError";
}
