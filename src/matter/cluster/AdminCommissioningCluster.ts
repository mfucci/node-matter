/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvByteString, TlvField, TlvObject, TlvUInt16, TlvUInt32 } from "@project-chip/matter.js";
import { Cluster, Command, TlvNoArguments, TlvNoResponse, OptionalCommand } from "./Cluster";

export const AdminCommissioningCluster = Cluster({
    id: 0x3c,
    name: "AdministratorCommissioning",
    revision: 1,

    commands: {
        openCommissioningWindow: Command(0, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
            pakeVerifier: TlvField(1, TlvByteString),
            discriminator: TlvField(2, TlvUInt16),
            iterations: TlvField(3, TlvUInt32),
            salt: TlvField(4, TlvByteString),
        }), 0, TlvNoResponse),

        openBasicCommissioningWindow: OptionalCommand(1, TlvObject({
            commissioningTimeout: TlvField(0, TlvUInt16),
        }), 1, TlvNoResponse),
        
        revokeCommissioning: Command(2, TlvNoArguments, 2, TlvNoResponse),
    },
});
