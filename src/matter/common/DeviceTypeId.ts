/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * A Device type ID is a 32-bit number that defines the type of the device.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 7.15
 */
export type DeviceTypeId = { deviceTypeId: true /* Hack to force strong type checking at compile time */ };
export const DeviceTypeId = (id: number) => id as unknown as DeviceTypeId;

/** Data model for a Device type ID. */
export const DeviceTypeIdT = Typed<DeviceTypeId>(UnsignedIntT);
