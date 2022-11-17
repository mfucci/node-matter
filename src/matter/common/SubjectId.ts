/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { spec } from "@project-chip/matter.js";
import { NodeId, TlvNodeId } from "./NodeId";

/**
 * The meaning of a "Subject" is primarily that of describing the source for an action, using a given
 * authentication method provided by the Secure Channel architecture.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 6.6.2.1
 */
export type SubjectId = NodeId; // Only NodeId is supported for now...

/** Tlv schema for a Subject Id */
export const TlvSubjectId = TlvNodeId;
