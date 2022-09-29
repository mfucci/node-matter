/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { networkInterfaces, NetworkInterfaceInfo } from "os";
import { UdpChannelOptions, UdpChannel } from "../UdpChannel";
import { UdpChannelNode } from "./UdpChannelNode";
import { Network } from "../Network";

function ipToNumber(ip: string) {
    const buffer = Buffer.alloc(4);
    const ipParts = ip.split(".");
    for (var i = 0; i < 4; i++) {
        buffer.writeUInt8(parseInt(ipParts[i]), i);
    }
    return buffer.readUInt32BE();
}

export class NetworkNode extends Network {
    createUdpChannel(options: UdpChannelOptions): Promise<UdpChannel> {
        return UdpChannelNode.create(options);
    }

    getIpMacAddresses(): {ip: string, mac: string}[] {
        const result = new Array<{ip: string, mac: string}>();
        const interfaces = networkInterfaces();
        for (const name in interfaces) {
            const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
            for (const {family, mac, address} of netInterfaces) {
                if (family !== "IPv4") continue;
                result.push({ip: address, mac});
            }
        }
        return result;
    }

    getIpMacOnInterface(remoteAddress: string): {ip: string, mac: string} | undefined {
        const remoteAddressNumber = ipToNumber(remoteAddress);
        const interfaces = networkInterfaces();
        for (const name in interfaces) {
            const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
            for (const {family, mac, address, netmask} of netInterfaces) {
                if (family !== "IPv4") continue;
                const netmaskNumber = ipToNumber(netmask);
                const ipNumber = ipToNumber(address);
                if ((ipNumber & netmaskNumber) !== (remoteAddressNumber & netmaskNumber)) continue;
                return {ip: address, mac};
            }
        }
        throw new Error(`Cannot find the device IP on the subnet containing ${remoteAddress}`);
    }
}
