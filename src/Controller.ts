#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterClient } from "./matter/MatterClient";
import { MdnsMatterScanner } from "./mdns/MdnsMatterScanner";
import { UdpInterface } from "./net/MatterUdpInterface";
import { Network } from "./net/Network";
import { NetworkNode } from "./net/node/NetworkNode";
import { getIntParameter, getParameter } from "./util/CommandLine";
import { singleton } from "./util/Singleton";

Network.get = singleton(() => new NetworkNode());

class Main {
    async start() {
        const ip = getParameter("ip");
        if (ip === undefined) throw new Error("Please specify the IP of the device to commission with -ip");
        const port = getIntParameter("port") ?? 5540;
        const discriminator = getIntParameter("discriminator") ?? 3840;
        const setupPin = getIntParameter("pin") ?? 20202021;
        const client = await MatterClient.create(await MdnsMatterScanner.create(), await UdpInterface.create(5540));
        try {
            await client.commission(ip, port, discriminator, setupPin);
        } finally {
            client.close();
        }
    }
}

new Main().start();
