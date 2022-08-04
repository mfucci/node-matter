/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ARecord, PtrRecord, SrvRecord, TxtRecord } from "../codec/DnsCodec";
import { Fabric } from "../fabric/Fabric";
import { MdnsServer } from "./MdnsServer";

const SERVICE_DISCOVERY_QNAME = "_services._dns-sd._udp.local";
const MATTER_SERVICE_QNAME = "_matter._tcp.local";

export class MatterMdnsServer {
    static async create() {
        const mdnsServer = await MdnsServer.create();
        return new MatterMdnsServer(mdnsServer);
    }

    constructor(
        private readonly mdnsServer: MdnsServer,
    ) {}

    addRecordsForFabric(fabric: Fabric) {
        const nodeIdBuffer = Buffer.alloc(8);
        nodeIdBuffer.writeBigUInt64BE(BigInt(fabric.nodeId));
        const nodeId = nodeIdBuffer.toString("hex").toUpperCase();
        const fabricId = fabric.operationalId.toString("hex").toUpperCase();
        const fabricQname = `_I${fabricId}._sub.${MATTER_SERVICE_QNAME}`;
        const deviceMatterQname = `${fabricId}-${nodeId}.${MATTER_SERVICE_QNAME}`;

        this.mdnsServer.setRecordsGenerator((ip, mac) => {
            const hostname = mac.replace(/:/g, "").toUpperCase() + "0000.local";
            return [
                PtrRecord(SERVICE_DISCOVERY_QNAME, MATTER_SERVICE_QNAME),
                PtrRecord(SERVICE_DISCOVERY_QNAME, fabricQname),
                PtrRecord(MATTER_SERVICE_QNAME, deviceMatterQname),
                PtrRecord(fabricQname, deviceMatterQname),
                ARecord(hostname, ip),
                // TODO: support IPv6
                // AAAARecord(this.localHostname, "fe80::9580:b733:6f54:9f43"),
                // TODO: the Matter port should not be hardcoded here
                SrvRecord(deviceMatterQname, {priority: 0, weight: 0, port: 5540, target: hostname }),
                TxtRecord(deviceMatterQname, ["SII=5000", "SAI=300", "T=1"]),
            ];
        });
    }

    async announce() {
        await this.mdnsServer.announce();
    }
}
