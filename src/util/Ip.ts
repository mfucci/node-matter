/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteArray } from "@project-chip/matter.js";

export function isIPv4(ip: string) {
    return ip.includes(".")
}

export function isIPv6(ip: string) {
    return ip.includes(":")
}

export function iPv4ToNumber(ip: string) {
    const dataView = new ByteArray(4).getDataView();
    const ipParts = ip.split(".");
    for (let i = 0; i < 4; i++) {
        dataView.setUint8(i, parseInt(ipParts[i]));
    }
    return dataView.getUint32(0);
}

export function iPv6ToArray(ip: string) {
    const array = new Uint16Array(8);
    let ipParts = ip.split(":");
    const valueCount = ipParts.filter(value => value !== "").length;
    if (valueCount !== 8) {
        ipParts = ip.replace("::", ":".padEnd((8 - valueCount) * 2 + 1, "0:")).split(":");
    }
    let index = 0;
    ipParts.forEach(part => {
        if (part === "") return;
        array[index++] = parseInt(part, 16);
    })
    return array;
}

export function onSameNetwork(ip1: string, ip2: string, mask: string) {
    if (isIPv4(ip1)) {
        // IPv4 addresses
        if (!isIPv4(ip2) || !isIPv4(mask)) return false;
        const ip1Number = iPv4ToNumber(ip1);
        const ip2Number = iPv4ToNumber(ip2);
        const maskNumber = iPv4ToNumber(mask);

        return (ip1Number & maskNumber) === (ip2Number & maskNumber);
    } else {
        // IPv6 addresses
        if (isIPv4(ip2) || isIPv4(mask)) return false;
        const ip1Array = iPv6ToArray(ip1);
        const ip2Array = iPv6ToArray(ip2);
        const maskArray = iPv6ToArray(mask);

        for (let i = 0; i < 16; i++) {
            const mask = maskArray[i];
            if (mask === 0) return true;
            if ((ip1Array[i] & mask) !== (ip2Array[i] & mask)) return false;
        }
    }
}
