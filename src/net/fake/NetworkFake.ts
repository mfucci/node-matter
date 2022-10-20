/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpChannelOptions, UdpChannel } from "../UdpChannel";
import { Network } from "../Network";
import { UdpChannelFake } from "./UdpChannelFake";

export class NetworkFake extends Network {
    constructor(
        private readonly ipMacs: {ip: string, mac: string}[],
    ) {
        super();
    }

    createUdpChannel(options: UdpChannelOptions): Promise<UdpChannel> {
        return UdpChannelFake.create(options);
    }

    getIpMacAddresses(): {ip: string, mac: string}[] {
        return this.ipMacs;
    }

    getIpMacOnInterface(remoteAddress: string): {ip: string, mac: string} | undefined {
        const remoteAddressPrefix = remoteAddress.slice(0, 6);
        return this.ipMacs.find(({ ip, mac }) => ip.slice(0, 6) === remoteAddressPrefix);
    }
}
