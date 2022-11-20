/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { tlv, spec } from "@project-chip/matter.js";

/**
 * A Device type ID is a 32-bit number that defines the type of the device.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 7.15
 */
export class DeviceTypeId {
    constructor(
        readonly id: number
    ) {}
}

/** Tlv schema for a Device type ID. */
export const TlvDeviceTypeId = new tlv.Wrapper<DeviceTypeId, number>(
    tlv.UInt32,
    deviceTypeId => deviceTypeId.id,
    value => new DeviceTypeId(value),
);
