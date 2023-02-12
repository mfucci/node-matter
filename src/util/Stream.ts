/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { MatterError } from "../error/MatterError";

export const END_OF_STREAM = "End-of-Stream";

export class EndOfStreamError extends MatterError {
    constructor() {
        super(END_OF_STREAM);
    }
};

export interface Stream<T> {
    read(): Promise<T>;
    write(data: T): Promise<void>;
}
