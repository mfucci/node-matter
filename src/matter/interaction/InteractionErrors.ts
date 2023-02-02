/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {MatterError} from "../../error/MatterError";
import {StatusCode} from "./InteractionMessages";

/** Specific Error for when a fabric is not found. */
export class FabricNotFoundError extends MatterError {}

/** Error base Class for all errors related to the status response messages. */
export class StatusResponseError extends MatterError {
    public constructor(
        public readonly message: string,
        public readonly code: StatusCode,
    ) {
        super();

        this.message = `(${code}) ${message}`;
    }
}
