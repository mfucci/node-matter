/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Typed, UnsignedIntT } from "../../codec/TlvObjectCodec";

/**
 * A Vendor Identifier (Vendor ID or VID) is a 16-bit number that uniquely identifies a particular
 * prod­uct manufacturer, vendor, or group thereof. Each Vendor ID is statically allocated by the
 * Connectiv­ity Standards Alliance (see [CSA Manufacturer Code Database]).
 * 
 * @see [Matter Specification R1.0], section 2.5.2
 */
export type VendorId = { vendorId: true /* Hack to force strong type checking at compile time */ };
export const VendorId = (id: number) => id as unknown as VendorId;

/** Data model for a Vendor Identifier. */
export const VendorIdT = Typed<VendorId>(UnsignedIntT);
