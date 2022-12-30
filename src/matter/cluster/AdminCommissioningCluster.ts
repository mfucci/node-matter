/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvByteString, TlvField, TlvObject, TlvUInt16, TlvUInt32 } from "@project-chip/matter.js";
import { Cluster, Command, TlvNoArguments, TlvNoResponse, OptionalCommand } from "./Cluster";

/**
 * This cluster is used to trigger a Node to allow a new Administrator to commission it.
 * 
 * @see {@link MatterCoreSpecificationV1_0} § 11.18
 */
export const AdminCommissioningCluster = Cluster({
    id: 0x3c,
    name: "AdministratorCommissioning",
    revision: 1,

    attributes: {
        // TODO: add attributes
    },

    commands: {
        openCommissioningWindow: Command(0, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
            pakePasscodeVerifier: TlvField(1, TlvByteString),
            discriminator: TlvField(2, TlvUInt16.bound({ max: 2047 })),
            iterations: TlvField(3, TlvUInt32.bound({ min: 1000, max: 100000 })),
            salt: TlvField(4, TlvByteString.bound({ minLength: 16, maxLength: 32 })),
        }), 0, TlvNoResponse),

        openBasicCommissioningWindow: OptionalCommand(1, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
        }), 1, TlvNoResponse),
        
        revokeCommissioning: Command(2, TlvNoArguments, 2, TlvNoResponse),
    },
});
