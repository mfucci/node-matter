/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpSocket } from '../io/udp/UdpSocket';
import { ExchangeSocket } from "../matter/common/ExchangeSocket";
import { NetInterface } from "../matter/common/NetInterface";

export class UdpInterface implements NetInterface {

    static async create(port: number = 5540, address?: string) {
        return new UdpInterface(await UdpSocket.create({port, address}));
    }

    constructor(
        private readonly server: UdpSocket,
    ) {}

    onData(listener: (socket: ExchangeSocket<Buffer>, messageBytes: Buffer) => void) {
        this.server.onMessage((peerAddress, peerPort, data) => listener(new UdpConnection(this.server, peerAddress, peerPort), data));
        console.log("Matter server listening");
    }
}

class UdpConnection implements ExchangeSocket<Buffer> {
    constructor(
        private readonly server: UdpSocket,
        private readonly peerAddress: string,
        private readonly peerPort: number,
    ) {}

    send(data: Buffer) {
        return this.server.send(this.peerAddress, this.peerPort, data);
    }

    getName() {
        return `udp://${this.peerAddress}:${this.peerPort}`;
    }
}
