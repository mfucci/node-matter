/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpSocketOptions, UdpSocket } from "../UdpSocket";
import { Network } from "../Network";
import { UdpSocketFake } from "./UdpSocketFake";

export class NetworkFake extends Network {
    constructor(
        private readonly ipMacs: {ip: string, mac: string}[],
    ) {
        super();
    }

    createUdpSocket(options: UdpSocketOptions): Promise<UdpSocket> {
        return UdpSocketFake.create(options);
    }

    getIpMacAddresses(): {ip: string, mac: string}[] {
        return this.ipMacs;
    }

    getIpMacOnInterface(remoteAddress: string): {ip: string, mac: string} {
        const remoteAddressPrefix = remoteAddress.slice(0, 6);
        const ipMac = this.ipMacs.find(({ ip, mac }) => ip.slice(0, 6) === remoteAddressPrefix);
        if (ipMac === undefined) throw new Error(`Cannot find the device IP on the subnet containing ${remoteAddress}`);
        return ipMac;
    }
}
