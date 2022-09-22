/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpSocket } from './UdpSocket';
import { ExchangeSocket } from "../matter/common/ExchangeSocket";
import { NetInterface, NetListener } from "./NetInterface";
import { Network } from './Network';

export class UdpInterface implements NetInterface {

    static async create(port: number, address?: string) {
        return new UdpInterface(await Network.get().createUdpSocket({listeningPort: port, multicastInterface: address, listeningAddress: address}));
    }

    constructor(
        private readonly server: UdpSocket,
    ) {}

    async openChannel(address: string, port: number) {
        return Promise.resolve(new UdpConnection(this.server, address, port));
    }

    onData(listener: (socket: ExchangeSocket<Buffer>, messageBytes: Buffer) => void): NetListener {
        return this.server.onData((peerAddress, peerPort, data) => listener(new UdpConnection(this.server, peerAddress, peerPort), data));
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
