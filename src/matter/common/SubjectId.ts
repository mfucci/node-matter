/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UnsignedLongT } from "../../codec/TlvObjectCodec";
import { NodeId } from "./NodeId";

/**
 * The meaning of a "Subject" is primarily that of describing the source for an action, using a given
 * authentication method provided by the Secure Channel architecture.
 * 
 * @see [Matter Specification R1.0], section 6.6.2.1
 */
export type SubjectId = NodeId; // Only NodeId is supported for now...

/** Data model for a Subject Id */
export const SubjectIdT = Typed<SubjectId>(UnsignedLongT);
