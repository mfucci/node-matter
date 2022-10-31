/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoundedUnsignedIntT, Typed, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * A Vendor Identifier (Vendor ID or VID) is a 16-bit number that uniquely identifies a particular
 * product manufacturer, vendor, or group thereof. Each Vendor ID is statically allocated by the
 * Connectivity Standards Alliance (see [CSA Manufacturer Code Database]).
 *
 * @see {@link MatterCoreSpecificationV1_0} § 2.5.2
 */
export type VendorId = { vendorId: true /* Hack to force strong type checking at compile time */ };
export const VendorId = (id: number) => id as unknown as VendorId;

/** Data model for a Vendor Identifier. */
export const VendorIdT = Typed<VendorId>(BoundedUnsignedIntT({ min: 0, max: 0xFFFF }));
