/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteStringT, Field, ObjectT, UInt16T, UInt32T } from "../../codec/TlvObjectCodec";
import { Cluster, Command, NoArgumentsT, NoResponseT, OptionalCommand } from "./Cluster";

 export const AdminCommissioningCluster = Cluster({
    id: 0x3c,
    name: "AdministratorCommissioning",
    commands: {
        openCommissioningWindow: Command(0, ObjectT({
            commissioningTimeout: Field(0, UInt16T),
            pakeVerifier: Field(1, ByteStringT()),
            discriminator: Field(2, UInt16T),
            iterations: Field(3, UInt32T),
            salt: Field(4, ByteStringT()),
        }), 0, NoResponseT),
        openBasicCommissioningWindow: OptionalCommand(1, ObjectT({
            commissioningTimeout: Field(0, UInt16T),
        }), 1, NoResponseT),
        revokeCommissioning: Command(2, NoArgumentsT, 2, NoResponseT),
    },
});
