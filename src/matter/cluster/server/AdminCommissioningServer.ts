/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../../MatterDevice";
import { PaseServer } from "../../session/secure/PaseServer";
import { SecureChannelProtocol } from "../../session/secure/SecureChannelProtocol";
import { Session } from "../../session/Session";
import { AdminCommissioningCluster } from "../AdminCommissioningCluster"
import { Attributes } from "../Cluster";
import { AttributeServers, ClusterServerHandlers } from "./ClusterServer"

export const AdminCommissioingHandler: (secureChannelProtocol: SecureChannelProtocol) => ClusterServerHandlers<typeof AdminCommissioningCluster> = (secureChannelProtocol) => ({
    openCommissioningWindow: async function ({ request: { pakePasscodeVerifier: pakeVerifier, discriminator, iterations, salt }, session}) {
        secureChannelProtocol.updatePaseCommissioner(PaseServer.fromVerificationValue(pakeVerifier, { iterations, salt }));
        session.getContext().openCommissioningModeWindow(2, discriminator);
    },

    revokeCommissioning: async function (args: { request: {}; attributes: AttributeServers<Attributes>; session: Session<MatterDevice>; }) {
        // TODO: implement this
    }
});
