/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { AdminCommissioningCluster } from "../AdminCommissioningCluster"
import { Attributes } from "../Cluster";
import { AttributeServers, ClusterServerHandlers } from "./ClusterServer"

export const AdminCommissioingHandler: ClusterServerHandlers<typeof AdminCommissioningCluster> = {
    commissioningTimeoutEnhanced: async function (args: { request: { commissioningTimeout: number; pakeVerifier: Buffer; discriminator: number; iterations: number; salt: Buffer; }; attributes: AttributeServers<Attributes>; session: Session<MatterDevice>; }) {
        // TODO: implement this
    },

    revokeCommissioning: async function (args: { request: {}; attributes: AttributeServers<Attributes>; session: Session<MatterDevice>; }) {
        // TODO: implement this
    }
};
