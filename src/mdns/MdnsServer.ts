/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";

import { ARecord, DnsCodec, DnsResponse, PtrRecord, SrvRecord, TxtRecord } from "../codec/DnsCodec";
import { Fabric } from "../fabric/Fabric";
import { getIpMacAddresses } from "../util/Network";
import { Singleton } from "../util/Singleton";

const MDNS_BROADCAST_IP = "224.0.0.251";
const MDNS_BROADCAST_PORT = 5353;

export const getMdnsServer = Singleton(() => new MdnsServer());

export class MdnsServer {
    private readonly server = dgram.createSocket("udp4");

    start() {
        this.server.setBroadcast(true);
    }

    async announceDevice(fabric: Fabric) {
        const { ip, mac } = getIpMacAddresses();
        const nodeIdBuffer = Buffer.alloc(8);
        nodeIdBuffer.writeBigUInt64BE(BigInt(fabric.nodeId));
        const nodeId = nodeIdBuffer.toString("hex").toUpperCase();
        const fabricId = fabric.operationalId.toString("hex").toUpperCase();
        const localHostname = mac.replace(/:/g, "").toUpperCase() + "0000";
        const broadcastMessage: DnsResponse = {
            transactionId: 0,
            answers: [
                PtrRecord("_services._dns-sd._udp.local", "_matter._tcp.local"),
                PtrRecord("_services._dns-sd._udp.local", `_I${fabricId}._sub._matter._tcp.local`),
                PtrRecord("_matter._tcp.local", `${fabricId}-${nodeId}._matter._tcp.local`),
                PtrRecord(`_I${fabricId}._sub._matter._tcp.local`, `${fabricId}-${nodeId}._matter._tcp.local`),
            ],
            additionalRecords: [
                ARecord(`${localHostname}.local`, ip),
                //AAAARecord("DCA632A0295F0000.local", "fe80::9580:b733:6f54:9f43"),
                SrvRecord(`${fabricId}-${nodeId}._matter._tcp.local`, {priority: 0, weight: 0, port: 5540, target: `${localHostname}.local` }),
                TxtRecord(`${fabricId}-${nodeId}._matter._tcp.local`, ["SII=5000", "SAI=300", "T=1"]),
            ],
        }

        return new Promise<void>((resolver, rejecter) => {
            this.server.send(DnsCodec.encodeResponse(broadcastMessage), MDNS_BROADCAST_PORT, MDNS_BROADCAST_IP, error => {
                if (error !== null) {
                    rejecter(error);
                }
                resolver();
            });
        });
    }
}

//new MdnsServer().announceDevice();