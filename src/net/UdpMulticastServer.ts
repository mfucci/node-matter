/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cache } from "../util/Cache";
import { Network } from "./Network";
import { UdpSocket, UdpSocketOptions } from "./UdpSocket";

export interface UdpMulticastServerOptions extends UdpSocketOptions {
    broadcastAddress: string,
    restrictToInterfaceIp?: string,
}

export class UdpMulticastServer {
    static async create({ restrictToInterfaceIp, broadcastAddress, listeningPort }: UdpMulticastServerOptions) {
        const network = Network.get();
        return new UdpMulticastServer(network, broadcastAddress, listeningPort, await network.createUdpSocket({ listeningAddress: broadcastAddress, listeningPort }), restrictToInterfaceIp);
    }

    private readonly broadcastSockets = new Cache<Promise<UdpSocket>>(ip => this.createBroadcastSocket(ip), 5 * 60 * 1000 /* 5mn */);

    private constructor(
        private readonly network: Network,
        private readonly broadcastAddress: string,
        private readonly broadcastPort: number,
        private readonly serverSocket: UdpSocket,
        private readonly restrictToInterfaceIp?: string,
    ) {}

    onMessage(listener: (message: Buffer, peerAddress: string) => void) {
       this.serverSocket.onData((peerAddress, port, message) => listener(message, peerAddress));
    }

    async send(message: Buffer, interfaceIp?: string) {
        const interfaceIps = interfaceIp !== undefined ? [ interfaceIp ] : this.restrictToInterfaceIp !== undefined ? [ this.restrictToInterfaceIp ] : this.network.getIpMacAddresses().map(({ip}) => ip);
        await Promise.all(interfaceIps.map(async ip => await (await this.broadcastSockets.get(ip)).send(this.broadcastAddress, this.broadcastPort, message)));
    }

    async createBroadcastSocket(interfaceIp: string): Promise<UdpSocket> {
        return await this.network.createUdpSocket({listeningAddress: this.broadcastAddress, listeningPort: this.broadcastPort, multicastInterface: interfaceIp});
    }

    close() {
        this.serverSocket.close();
        this.broadcastSockets.close();
    }
}
