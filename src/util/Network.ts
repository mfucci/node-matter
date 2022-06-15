/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { networkInterfaces, NetworkInterfaceInfo } from "os";

export function getIpMacAddresses(): {ip: string, mac: string} {
    const interfaces = networkInterfaces();
    for (var name in interfaces) {
        const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
        for (var netInterface of netInterfaces) {
            if (netInterface.internal || netInterface.family !== "IPv4") continue;
            return {ip: netInterface.address, mac: netInterface.mac};
        }
    }
    throw new Error(`Cannot determine the host IP address`);
}