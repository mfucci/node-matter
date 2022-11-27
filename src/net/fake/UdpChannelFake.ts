/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpChannel, UdpChannelOptions } from "../UdpChannel";
import { NetListener } from "../NetInterface";
import { SimulatedNetwork } from "./SimulatedNetwork";
import { ByteArray } from "@project-chip/matter.js";

export class UdpChannelFake implements UdpChannel {
    static async create({listeningAddress: address, listeningPort: port, multicastInterface}: UdpChannelOptions) {
        if (address === undefined) throw new Error("Device IP address should be specified for fake UdpSocket");
        return new UdpChannelFake(SimulatedNetwork.get(), address, port, multicastInterface);
    }

    private readonly netListeners = new Array<NetListener>();

    constructor(
        private readonly network: SimulatedNetwork,
        private readonly address: string,
        private readonly port: number,
        private readonly multicastInterface?: string) {
    }

    onData(listener: (peerAddress: string, peerPort: number, data: ByteArray) => void) {
        const netListener = this.network.onUdpData(this.address, this.port, listener);
        this.netListeners.push(netListener);
        return netListener;
    }

    async send(address: string, port: number, data: ByteArray) {
        if (this.multicastInterface === undefined) throw new Error("Device interface should be specified to send data with a fake UdpSocket");
        this.network.sendUdp(this.multicastInterface, this.port, address, port, data);
    }

    close() {
        this.netListeners.forEach(netListener => netListener.close());
        this.netListeners.length = 0;
    }
}
