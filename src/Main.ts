/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterServer, Protocol } from "./server/MatterServer";
import { UdpChannel } from "./channel/UdpChannel";
import { SecureChannelHandler } from "./session/secure/SecureChannelHandler";
import { PasePairing } from "./session/secure/PasePairing";
import { Crypto } from "./crypto/Crypto";
import { CasePairing } from "./session/secure/CasePairing";
import { InteractionProtocol } from "./interaction/InteractionProtocol";
import { Device } from "./interaction/model/Device";
import { Endpoint } from "./interaction/model/Endpoint";
import { BasicCluster } from "./interaction/cluster/BasicCluster";
import { GeneralCommissioningCluster } from "./interaction/cluster/GeneralCommissioningCluster";
import { OperationalCredentialsCluster } from "./interaction/cluster/OperationalCredentialsCluster";
import { OnOffCluster } from "./interaction/cluster/OnOffCluster";
import { execSync } from "child_process";

const commandArguments = process.argv.slice(2);

function getParameter(name: string) {
    const markerIndex = commandArguments.indexOf(`-${name}`);
    if (markerIndex === -1 || markerIndex + 1 === commandArguments.length) return undefined;
    return commandArguments[markerIndex + 1];
}

function executor(scriptParamName: string) {
    const script = getParameter(scriptParamName);
    if (script === undefined) return undefined;
    return () => console.log(`${scriptParamName}: ${execSync(script).toString().slice(0, -1)}`);
}

class Main {
    start() {
        new MatterServer()
            .addChannel(new UdpChannel(5540))
            .addProtocolHandler(Protocol.SECURE_CHANNEL, new SecureChannelHandler(
                    new PasePairing(20202021, { iteration: 1000, salt: Crypto.getRandomData(32) }),
                    new CasePairing(),
                ))
            .addProtocolHandler(Protocol.INTERACTION_MODEL, new InteractionProtocol(new Device([
                new Endpoint(0x00, "MA-rootdevice", [
                    new BasicCluster({ vendorName: "node-matter", vendorId: 0xFFF1, productName: "Matter test device", productId: 0X8001 }),
                    new GeneralCommissioningCluster(),
                    new OperationalCredentialsCluster(),
                ]),
                new Endpoint(0x01, "MA-OnOff", [
                        new OnOffCluster(executor("on"), executor("off")),
                ]),
            ])))
            .start()
    }
}

new Main().start();
