/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cache } from "../util/Cache";
import { Network } from "./Network";
import { UdpChannel, UdpChannelOptions } from "./UdpChannel";
import { ByteArray } from "@project-chip/matter.js";

export interface UdpMulticastServerOptions extends UdpChannelOptions {
    broadcastAddress: string,
    restrictToInterfaceIp?: string,
}

export class UdpMulticastServer {
    static async create({ restrictToInterfaceIp, broadcastAddress, listeningPort }: UdpMulticastServerOptions) {
        const network = Network.get();
        return new UdpMulticastServer(network, broadcastAddress, listeningPort, await network.createUdpChannel({ listeningAddress: broadcastAddress, listeningPort }), restrictToInterfaceIp);
    }

    private readonly broadcastChannels = new Cache<Promise<UdpChannel>>(ip => this.createBroadcastChannel(ip), 5 * 60 * 1000 /* 5mn */);

    private constructor(
        private readonly network: Network,
        private readonly broadcastAddress: string,
        private readonly broadcastPort: number,
        private readonly server: UdpChannel,
        private readonly restrictToInterfaceIp?: string,
    ) {}

    onMessage(listener: (message: ByteArray, peerAddress: string) => void) {
       this.server.onData((peerAddress, port, message) => listener(message, peerAddress));
    }

    async send(message: ByteArray, interfaceIp?: string) {
        const interfaceIps = interfaceIp !== undefined ? [ interfaceIp ] : this.restrictToInterfaceIp !== undefined ? [ this.restrictToInterfaceIp ] : this.network.getIpMacAddresses().map(({ip}) => ip);
        await Promise.all(interfaceIps.map(async ip => await (await this.broadcastChannels.get(ip)).send(this.broadcastAddress, this.broadcastPort, message)));
    }

    async createBroadcastChannel(interfaceIp: string): Promise<UdpChannel> {
        return await this.network.createUdpChannel({listeningAddress: interfaceIp, listeningPort: this.broadcastPort, multicastInterface: interfaceIp});
    }

    close() {
        this.server.close();
        this.broadcastChannels.close();
    }
}
