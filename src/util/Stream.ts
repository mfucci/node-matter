/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export const END_OF_STREAM = "End-of-Stream";

export interface Stream<T> {
    read(): Promise<T>;
    write(data: T): Promise<void>;
}
