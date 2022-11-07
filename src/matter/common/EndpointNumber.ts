/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UInt16T } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * A Endpoint Number is a 16-bit number that that indicates an instance of a device type.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 7.18.2.11
 */
export type EndpointNumber = { endpointNumber: true /* Hack to force strong type checking at compile time */ };
export const EndpointNumber = (id: number) => id as unknown as EndpointNumber;

/** Data model for a Endpoint number. */
export const EndpointNumberT = Typed<EndpointNumber>(UInt16T);
