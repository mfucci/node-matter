/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {KeyValueHandler} from "./keyvalue/KeyValueHandler";
import {Store} from "./store/Store";

export interface KeyValueStorage extends KeyValueHandler, Store {}
