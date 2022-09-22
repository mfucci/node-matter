/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpSocket, UdpSocketOptions } from "../UdpSocket";
import { NetListener } from "../NetInterface";
import { SimulatedNetwork } from "./SimulatedNetwork";

export class UdpSocketFake implements UdpSocket {
    static async create({listeningAddress: address, listeningPort: port, multicastInterface}: UdpSocketOptions) {
        if (address === undefined) throw new Error("Device IP address should be specified for fake UdpSocket");
        return new UdpSocketFake(SimulatedNetwork.get(), address, port, multicastInterface);
    }

    private readonly netListeners = new Array<NetListener>();

    constructor(
        private readonly network: SimulatedNetwork,
        private readonly address: string,
        private readonly port: number,
        private readonly multicastInterface?: string) {
    }

    onData(listener: (peerAddress: string, peerPort: number, data: Buffer) => void) {
        const netListener = this.network.onUdpData(this.address, this.port, listener);
        this.netListeners.push(netListener);
        return netListener;
    }

    async send(address: string, port: number, data: Buffer) {
        if (this.multicastInterface === undefined) throw new Error("Device interface should be specified to send data with a fake UdpSocket");
        this.network.sendUdp(this.multicastInterface, this.port, address, port, data);
    }

    close() {
        this.netListeners.forEach(netListener => netListener.close());
        this.netListeners.length = 0;
    }
}
