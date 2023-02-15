/**
 * Utils for Platform.ts.
 *
 * @license
 * Copyright 2023 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export function isMacOSX () : boolean {
  return process.platform === 'darwin'
}