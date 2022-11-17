/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tlv, spec } from "@project-chip/matter.js";

/**
 * A Endpoint Number is a 16-bit number that that indicates an instance of a device type.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 7.18.2.11
 */
export class EndpointNumber {
    constructor(
        readonly number: number
    ) {}
}

/** Tlv schema for an Endpoint number. */
export const TlvEndpointNumber = new tlv.Wrapper(
    tlv.UInt16,
    (endpointNumber: EndpointNumber) => endpointNumber.number,
    value => new EndpointNumber(value),
);
