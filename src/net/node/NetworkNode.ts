/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { networkInterfaces, NetworkInterfaceInfo } from "os";
import { UdpChannelOptions, UdpChannel } from "../UdpChannel";
import { UdpChannelNode } from "./UdpChannelNode";
import { Network } from "../Network";
import { isLocalIPv6Address, onSameNetwork } from "../../util/Ip.js";
import { Cache } from "../../util/Cache.js";

export class NetworkNode extends Network {

    static getMulticastInterface(netInterface: string, ipv4: boolean) {
        if (ipv4) {
            const netInterfaceInfo = networkInterfaces()[netInterface];
            if (netInterfaceInfo === undefined) throw new Error(`Unknown interface: ${netInterface}`);
            for (const {address, family} of netInterfaceInfo) {
                if (family === "IPv4") {
                    return address;
                }
            }
            throw new Error(`No IPv4 addresses on interface: ${netInterface}`);
        } else {
            return `::%${netInterface}`;
        }
    }

    static getNetInterfaceForIp(ip: string) {
        // Finding the local interface on the same interface is complex and won't change
        // So let's cache the results for 5mn
        return this.netInterfaces.get(ip);
    }

    private static readonly netInterfaces = new Cache<string | undefined>(
        (ip: string) => this.getNetInterfaceForIpInternal(ip),
        5 * 60 * 1000, /* 5mn */
    )

    private static getNetInterfaceForIpInternal(ip: string) {
        if (ip.indexOf("%") !== -1) {
            // IPv6 address with scope
            return ip.split("%")[1];
        } else {
            const interfaces = networkInterfaces();
            for (const name in interfaces) {
                const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
                for (const {address, netmask} of netInterfaces) {
                    if (onSameNetwork(ip, address, netmask)) {
                        return name;
                    }
                }
            }
            return undefined;
        }
    }

    getNetInterfaces(): string[] {
        const result = new Array<string>();
        const interfaces = networkInterfaces();
        for (const name in interfaces) {
            const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
            if (netInterfaces.length === 0) continue;
            if (netInterfaces[0].internal) continue;
            result.push(name);
        }
        return result;
    }

    getIpMac(netInterface: string): { mac: string; ips: string[]; } | undefined {
        const netInterfaceInfo = networkInterfaces()[netInterface];
        if (netInterfaceInfo === undefined) return undefined;
        // only use local IPv6 address
        const ips = netInterfaceInfo.map(({address}) => address).filter(ip => isLocalIPv6Address(ip))
        return { mac: netInterfaceInfo[0].mac, ips: ips };
    }

    override createUdpChannel(options: UdpChannelOptions): Promise<UdpChannel> {
        return UdpChannelNode.create(options);
    }
}
