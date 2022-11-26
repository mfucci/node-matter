/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpChannel } from './UdpChannel';
import { Channel } from "./Channel";
import { NetInterface, NetListener } from "./NetInterface";
import { Network } from './Network';
import { util } from "@project-chip/matter.js";

export class UdpInterface implements NetInterface {

    static async create(port: number, address?: string) {
        return new UdpInterface(await Network.get().createUdpChannel({listeningPort: port, multicastInterface: address, listeningAddress: address}));
    }

    constructor(
        private readonly server: UdpChannel,
    ) {}

    async openChannel(address: string, port: number) {
        return Promise.resolve(new UdpConnection(this.server, address, port));
    }

    onData(listener: (channel: Channel<util.ByteArray>, messageBytes: util.ByteArray) => void): NetListener {
        return this.server.onData((peerAddress, peerPort, data) => listener(new UdpConnection(this.server, peerAddress, peerPort), data));
    }
}

class UdpConnection implements Channel<util.ByteArray> {
    constructor(
        private readonly server: UdpChannel,
        private readonly peerAddress: string,
        private readonly peerPort: number,
    ) {}

    send(data: util.ByteArray) {
        return this.server.send(this.peerAddress, this.peerPort, data);
    }

    getName() {
        return `udp://${this.peerAddress}:${this.peerPort}`;
    }
}
