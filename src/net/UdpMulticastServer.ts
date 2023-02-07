/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cache } from "../util/Cache";
import { Network } from "./Network";
import { UdpChannel } from "./UdpChannel";
import { ByteArray } from "@project-chip/matter.js";
import { isIPv4 } from "../util/Ip";
import { Logger } from "../log/Logger";

const logger = Logger.get("UdpMulticastServer");

export interface UdpMulticastServerOptions {
    listeningPort: number,
    broadcastAddressIpv4: string,
    broadcastAddressIpv6: string,
    netInterface?: string,
}

export class UdpMulticastServer {
    static async create({ netInterface, broadcastAddressIpv4, broadcastAddressIpv6, listeningPort }: UdpMulticastServerOptions) {
        const network = Network.get();
        return new UdpMulticastServer(
            network,
            broadcastAddressIpv4,
            broadcastAddressIpv6,
            listeningPort,
            await network.createUdpChannel({ type: "udp4", netInterface, listeningPort }),
            await network.createUdpChannel({ type: "udp6", netInterface, listeningPort }),
        );
    }

    private readonly broadcastChannels = new Cache<Promise<UdpChannel>>((netInterface, iPv4) => this.createBroadcastChannel(netInterface, iPv4), 5 * 60 * 1000 /* 5mn */);

    private constructor(
        private readonly network: Network,
        private readonly broadcastAddressIpv4: string,
        private readonly broadcastAddressIpv6: string,
        private readonly broadcastPort: number,
        private readonly serverIpv4: UdpChannel,
        private readonly serverIpv6: UdpChannel,
    ) {}

    onMessage(listener: (message: ByteArray, peerAddress: string, netInterface: string) => void) {
       this.serverIpv4.onData((netInterface, peerAddress, _port, message) => listener(message, peerAddress, netInterface));
       this.serverIpv6.onData((netInterface, peerAddress, _port, message) => listener(message, peerAddress, netInterface));
    }

    async send(message: ByteArray, netInterface?: string) {
        const netInterfaces = netInterface !== undefined ? [netInterface] : this.network.getNetInterfaces();
        await Promise.all(netInterfaces.map(async netInterface => {
            const { ips } = this.network.getIpMac(netInterface) ?? { ips: [] };
            await Promise.all(ips.map(async ip => {
                const iPv4 = isIPv4(ip);
                try {
                    await (await this.broadcastChannels.get(netInterface, iPv4)).send(iPv4 ? this.broadcastAddressIpv4 : this.broadcastAddressIpv6, this.broadcastPort, message);
                } catch (err) {
                    logger.info(`${netInterface}: ${(err as Error).message}`);
                }
            }));
        }));
    }

    private async createBroadcastChannel(netInterface: string, iPv4: string): Promise<UdpChannel> {
        return await this.network.createUdpChannel({type: iPv4 ? "udp4" : "udp6", listeningPort: this.broadcastPort, netInterface});
    }

    close() {
        this.serverIpv4.close();
        this.serverIpv6.close();
        this.broadcastChannels.close();
    }
}
