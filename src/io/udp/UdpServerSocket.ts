/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";
import { createDgramSocket } from "./DgramSocket";
import { UdpSocket } from "./UdpSocket";

export class UdpServerSocket {

    static async create(port: number, connectListener: (socket: UdpSocket) => void) {
        return new UdpServerSocket(await createDgramSocket(port, { type: "udp4" }), connectListener);
    }

    private readonly sockets = new Map<string, UdpSocket>();

    private constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly connectListener: (socket: UdpSocket) => void
    ) {
        dgramSocket.on("message", (message, { address, port }) => this.onMessage(message, address, port));
    }

    private onMessage(message: Buffer, peerAddress: string, peerPort: number) {
        const socketId = `${peerAddress}:${peerPort}`;
        let socket = this.sockets.get(socketId);
        if (socket === undefined) {
            socket = new UdpSocket(this.dgramSocket, socketId, peerAddress, peerPort, () => this.sockets.delete(socketId));
            this.sockets.set(socketId, socket);
            this.connectListener(socket);
        }
        socket.onMessage(message);
    }
}
