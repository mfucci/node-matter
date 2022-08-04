/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";
import { Cache } from "../../util/Cache";
import { createDgramSocket } from "./DgramSocket";

export class UdpMulticastServer {
    static async create(address: string, port: number) {
        return new UdpMulticastServer(address, port, await createDgramSocket(port, { type: "udp4", reuseAddr: true }));
    }

    private broadcastSockets = new Cache<Promise<dgram.Socket>>(ip => this.createBroadcastSocket(ip), 5 * 60 * 1000 /* 5mn */);

    private constructor(
        private readonly broadcastAddress: string,
        private readonly broadcastPort: number,
        private readonly serverSocket: dgram.Socket
    ) { }

    onMessage(listener: (message: Buffer, remoteIp: string) => void) {
        this.serverSocket.on("message", (message, { address: remoteIp }) => listener(message, remoteIp));
    }

    send(interfaceIp: string, message: Buffer): Promise<void> {
        return new Promise<void>(async (resolver, rejecter) => {
            let broadcastSocket = await this.broadcastSockets.get(interfaceIp);
            broadcastSocket.send(message, this.broadcastPort, this.broadcastAddress, error => {
                if (error !== null) {
                    rejecter(error);
                    return;
                }
                resolver();
            });
        });
    }

    async createBroadcastSocket(interfaceIp: string): Promise<dgram.Socket> {
        const result = await createDgramSocket(this.broadcastPort, { type: "udp4", reuseAddr: true });
        result.setMulticastInterface(interfaceIp);
        return result;
    }
}
