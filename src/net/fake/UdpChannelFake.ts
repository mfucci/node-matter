/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpChannel, UdpChannelOptions } from "../UdpChannel";
import { NetListener } from "../NetInterface";
import { FAKE_INTERFACE_NAME, SimulatedNetwork } from "./SimulatedNetwork";
import { ByteArray } from "@project-chip/matter.js";
import { isIPv4 } from "../../util/Ip";
import { NetworkFake } from "./NetworkFake";

export class UdpChannelFake implements UdpChannel {
    static async create(network: NetworkFake, {listeningAddress, listeningPort, netInterface, type}: UdpChannelOptions) {
        const { ips } = network.getIpMac(netInterface ?? FAKE_INTERFACE_NAME);
        const ipv4 = type === "udp4";
        const localAddress = ips.filter(ip => isIPv4(ip) || !ipv4)[0];
        if (localAddress === undefined) throw new Error("No matching IP on the specified interface");
        return new UdpChannelFake(localAddress, listeningAddress, listeningPort);
    }

    private readonly netListeners = new Array<NetListener>();
    private readonly simulatedNetwork = SimulatedNetwork.get();

    constructor(
        private readonly localAddress: string,
        private readonly listeningAddress: string | undefined,
        private readonly listeningPort: number,
    ) {}

    onData(listener: (netInterface: string, peerAddress: string, peerPort: number, data: ByteArray) => void) {
        const netListener = this.simulatedNetwork.onUdpData(this.listeningAddress, this.listeningPort, listener);
        this.netListeners.push(netListener);
        return netListener;
    }

    async send(address: string, port: number, data: ByteArray) {
        this.simulatedNetwork.sendUdp(this.localAddress, this.listeningPort, address, port, data);
    }

    close() {
        this.netListeners.forEach(netListener => netListener.close());
        this.netListeners.length = 0;
    }
}
