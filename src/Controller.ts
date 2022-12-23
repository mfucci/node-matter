#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterController } from "./matter/MatterController";
import { UdpInterface } from "./net/UdpInterface";
import { Network } from "./net/Network";
import { NetworkNode } from "./net/node/NetworkNode";
import { getIntParameter, getParameter } from "./util/CommandLine";
import { singleton } from "./util/Singleton";
import { MdnsScanner } from "./matter/mdns/MdnsScanner";
import { Time } from "./time/Time";
import { TimeNode } from "./time/TimeNode";
import { Logger } from "./log/Logger";
import packageJson from "../package.json";

Network.get = singleton(() => new NetworkNode());
Time.get = singleton(() => new TimeNode());

const logger = Logger.get("Controller");

class Controller {
    async start() {
        logger.info(`node-matter@${packageJson.version}`);

        const ip = getParameter("ip");
        if (ip === undefined) throw new Error("Please specify the IP of the device to commission with -ip");
        const port = getIntParameter("port") ?? 5540;
        const discriminator = getIntParameter("discriminator") ?? 3840;
        const setupPin = getIntParameter("pin") ?? 20202021;
        const client = await MatterController.create(await MdnsScanner.create(), await UdpInterface.create(5540, "udp6"));
        try {
            await client.commission(ip, port, discriminator, setupPin);
        } finally {
            client.close();
        }
    }
}

new Controller().start();
