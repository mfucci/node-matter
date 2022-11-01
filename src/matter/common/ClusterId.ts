/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * A Cluster Identifier is a 32 bit number and SHALL reference a single cluster specification and
 * SHALL define conformance to that specification.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 7.10
 */
export type ClusterId = { clusterId: true /* Hack to force strong type checking at compile time */ };
export const ClusterId = (id: number) => id as unknown as ClusterId;

/** Data model for a Cluster Identifier. */
export const ClusterIdT = Typed<ClusterId>(UnsignedIntT);
