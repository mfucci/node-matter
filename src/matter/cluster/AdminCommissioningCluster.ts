/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BitFlag, TlvByteString, TlvEnum, TlvField, TlvNullable, TlvObject, TlvUInt16, TlvUInt32 } from "@project-chip/matter.js";
import { TlvFabricIndex } from "../common/FabricIndex";
import { TlvVendorId } from "../common/VendorId";
import { Cluster, Command, TlvNoArguments, TlvNoResponse, OptionalCommand, Attribute } from "./Cluster";

export const enum WindowStatus {
    /** Commissioning win­dow not open */
    WindowNotOpen = 0,

    /** An Enhanced Commis­sioning Method win­dow is open */
    EnhancedWindowOpen = 1,

    /** A Basic Commissioning Method window is open */
    BasicWindowOpen = 2,
}

/**
 * This cluster is used to trigger a Node to allow a new Administrator to commission it.
 * 
 * @see {@link MatterCoreSpecificationV1_0} § 11.18
 */
export const AdminCommissioningCluster = Cluster({
    id: 0x3c,
    name: "AdministratorCommissioning",
    revision: 1,
    features: {
        /** Node supports Basic Commissioning Method. */
        basic: BitFlag(0),
    },

    attributes: {
        /** Indicates whether a new Commissioning window has been opened by an Administrator. */
        windowStatus: Attribute(0, TlvEnum<WindowStatus>()),

        /** If a window is opened, indicates the FabricIndex of the Administrator fabric that opened the window. */
        adminFabricIndex: Attribute(1, TlvNullable(TlvFabricIndex)),

        /** If a window is opened, indicates the vendorId of the Administrator fabric that opened the window. */
        adminVendorId: Attribute(2, TlvNullable(TlvVendorId)),
    },

    commands: {
        openCommissioningWindow: Command(0, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
            pakePasscodeVerifier: TlvField(1, TlvByteString),
            discriminator: TlvField(2, TlvUInt16.bound({ max: 2047 })),
            iterations: TlvField(3, TlvUInt32.bound({ min: 1000, max: 100000 })),
            salt: TlvField(4, TlvByteString.bound({ minLength: 16, maxLength: 32 })),
        }), 0, TlvNoResponse),

        openBasicCommissioningWindow: Command(1, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
        }), 1, TlvNoResponse),
        
        revokeCommissioning: Command(2, TlvNoArguments, 2, TlvNoResponse),
    },
});
