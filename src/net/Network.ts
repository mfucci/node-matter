/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpChannel, UdpChannelOptions } from "./UdpChannel";

export abstract class Network {
    static get: () => Network = () => { throw new Error("No provider configured"); };

    abstract createUdpChannel(options: UdpChannelOptions): Promise<UdpChannel>;
    abstract getIpMacAddresses(): {ip: string, mac: string}[];
    abstract getIpMacOnInterface(remoteAddress: string): {ip: string, mac: string} | undefined;
}
