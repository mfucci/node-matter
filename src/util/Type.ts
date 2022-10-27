/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

/** Merges two types into one */
export type Merge<A, B, AB = A & B> = { [K in keyof AB]: AB[K] };
