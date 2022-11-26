/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";
import { Logger } from "../../log/Logger";
import { UdpChannel, UdpChannelOptions } from "../UdpChannel";
import { util } from "@project-chip/matter.js";

const logger = Logger.get("UdpChannelNode");

function createDgramSocket(address: string | undefined, port: number, options: dgram.SocketOptions) {
    const socket = dgram.createSocket(options);
    return new Promise<dgram.Socket>((resolve, reject) => {
        const handleBindError = (error: Error) => {
            socket.close();
            reject(error);
        };
        socket.on("error", handleBindError);
        socket.bind(port, address, () => {
            socket.removeListener("error", handleBindError);
            socket.on("error", error => logger.error(error));
            resolve(socket);
        });
    });
}

export class UdpChannelNode implements UdpChannel {
    static async create({listeningPort, listeningAddress, multicastInterface}: UdpChannelOptions) {
        const socket = await createDgramSocket(listeningAddress, listeningPort, { type: "udp4", reuseAddr: true });
        if (multicastInterface !== undefined) socket.setMulticastInterface(multicastInterface);
        return new UdpChannelNode(socket);
    }

    constructor(private readonly socket: dgram.Socket) {}

    onData(listener: (peerAddress: string, peerPort: number, data: util.ByteArray) => void) {
        const messageListener = (data: util.ByteArray, { address, port }: { address: string, port: number }) => listener(address, port, data);

        this.socket.on("message", messageListener);
        return {
            close: () => {
                this.socket.removeListener("message", messageListener);
            }
        };
    }

    async send(address: string, port: number, data: util.ByteArray) {
        return new Promise<void>((resolve, reject) => {
            this.socket.send(data, port, address, error => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    close() {
        this.socket.close();
    }
}
