/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";
import { Queue } from "./Queue";
import { Stream } from "./Stream";

export class UdpServerSocket {

    static async create(port: number, connectListener: (socket: UdpSocket) => void) {
        const socket = dgram.createSocket("udp4");
        return new Promise<UdpServerSocket>((resolve, reject) => {
            const handleBindError = (error: Error) => {
                socket.close();
                reject(error);
            };
            socket.on("error", handleBindError);
            socket.bind(port, () => {
                socket.removeListener("error", handleBindError);
                socket.on("error", error => console.log(error));
                resolve(new UdpServerSocket(socket, connectListener));
            });
        })
    }

    private readonly sockets = new Map<string, UdpSocket>();

    private constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly connectListener: (socket: UdpSocket) => void,
    ) {
        dgramSocket.on("message", (message, {address, port}) => this.onMessage(message, address, port));
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

export class UdpSocket implements Stream<Buffer> {
    private readonly receivedMessages = new Queue<Buffer>();

    constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly id: string,
        private readonly peerAddress: string,
        private readonly peerPort: number,
        private readonly closeCallback: () => void,
    ) {}

    onMessage(message: Buffer) {
        this.receivedMessages.write(message);
    }

    async read(): Promise<Buffer> {
        return this.receivedMessages.read();
    }

    async write(message: Buffer) {
        return new Promise<void>((resolve, reject) => {
            this.dgramSocket.send(message, this.peerPort, this.peerAddress, error => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve();
            });
        })
    }

    close() {
        this.closeCallback();
    }

    toString() {
        return `udp://${this.id}`;
    }
}

export class UdpMulticastServer {
    static async create(address: string, port: number) {
        const socket = dgram.createSocket({type: "udp4", reuseAddr: true});
        return new Promise<UdpMulticastServer>((resolve, reject) => {
            const handleBindError = (error: Error) => {
                socket.close();
                reject(error);
            };
            socket.on("error", handleBindError);
            socket.bind(port, address, () => {
                socket.removeListener("error", handleBindError);
                socket.on("error", error => console.log(error));
                resolve(new UdpMulticastServer(address, port, socket));
            });
        })
    }

    private broadcastSockets = new Map<string, dgram.Socket>();

    private constructor(
        private readonly broadcastAddress: string,
        private readonly broadcastPort: number,
        private readonly serverSocket: dgram.Socket,
    ) {}

    onMessage(listener: (message: Buffer, remoteIp: string) => void) {
        this.serverSocket.on("message", (message, {address: remoteIp}) => listener(message, remoteIp));
    }

    send(interfaceIp: string, message: Buffer): Promise<void> {
        return new Promise<void>(async (resolver, rejecter) => {
            let socket = this.broadcastSockets.get(interfaceIp);
            if (socket === undefined) {
                socket = await this.createBroadcastSocket(interfaceIp);
                this.broadcastSockets.set(interfaceIp, socket);
            }
            socket.send(message, this.broadcastPort, this.broadcastAddress, error => {
                if (error !== null) {
                    rejecter(error);
                    return;
                }
                resolver();
            });
        });
    }

    async createBroadcastSocket(interfaceIp: string): Promise<dgram.Socket> {
        const socket = dgram.createSocket({type: "udp4", reuseAddr: true});
        return new Promise<dgram.Socket>((resolve, reject) => {
            const handleBindError = (error: Error) => {
                socket.close();
                reject(error);
            };
            socket.on("error", handleBindError);
            socket.bind(this.broadcastPort, () => {
                socket.setMulticastInterface(interfaceIp);
                socket.removeListener("error", handleBindError);
                socket.on("error", error => console.log(error));
                resolve(socket);
            });
        });
    }
}
