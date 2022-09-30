/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExchangeSocket<T> {
    send(data: T): Promise<void>;
    getName(): string;
}
