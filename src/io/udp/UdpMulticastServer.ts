/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cache } from "../../util/Cache";
import { UdpSocket, UdpSocketOptions } from "./UdpSocket";

export interface UdpMulticastServerOptions extends UdpSocketOptions {
    broadcastAddress: string,
}

export class UdpMulticastServer {
    static async create({ address, broadcastAddress, port }: UdpMulticastServerOptions) {
        return new UdpMulticastServer(address, broadcastAddress, port, await UdpSocket.create({ address, port }));
    }

    private readonly broadcastSockets = new Cache<Promise<UdpSocket>>(ip => this.createBroadcastSocket(ip), 5 * 60 * 1000 /* 5mn */);

    private constructor(
        private readonly address: string | undefined,
        private readonly broadcastAddress: string,
        private readonly broadcastPort: number,
        private readonly serverSocket: UdpSocket,
    ) {}

    onMessage(listener: (message: Buffer, peerAddress: string) => void) {
       this.serverSocket.onData((peerAddress, port, message) => listener(message, peerAddress));
    }

    async send(interfaceIp: string, message: Buffer) {
        const broadcastSocket = await this.broadcastSockets.get(interfaceIp);
        await broadcastSocket.send(this.broadcastAddress, this.broadcastPort, message);
    }

    async createBroadcastSocket(interfaceIp: string): Promise<UdpSocket> {
        return await UdpSocket.create({address: this.address, port: this.broadcastPort, multicastInterface: interfaceIp});
    }

    close() {
        this.serverSocket.close();
        this.broadcastSockets.close();
    }
}
