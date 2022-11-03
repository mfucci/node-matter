/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UInt64T } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";
import { NodeId } from "./NodeId";
import { FabricId } from "./FabricId";

/**
 * The meaning of a "Subject" is primarily that of describing the source for an action, using a given
 * authentication method provided by the Secure Channel architecture.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 6.6.2.1
 */
export type SubjectId = NodeId; // Only NodeId is supported for now...

/** Explicitly convert a FabricID to a bigint */
export const subjectIdToBigint = (subjectId: SubjectId) => subjectId as unknown as bigint;

/** Data model for a Subject Id */
export const SubjectIdT = Typed<SubjectId>(UInt64T);
