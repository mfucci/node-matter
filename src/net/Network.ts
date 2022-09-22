/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { UdpSocket, UdpSocketOptions } from "./UdpSocket";

export abstract class Network {
    static get: () => Network = () => { throw new Error("No provider configured"); };

    abstract createUdpSocket(options: UdpSocketOptions): Promise<UdpSocket>;
    abstract getIpMacAddresses(): {ip: string, mac: string}[];
    abstract getIpMacOnInterface(remoteAddress: string): {ip: string, mac: string};
}
