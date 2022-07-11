/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ARecord, DnsCodec, MessageType, PtrRecord, Record, RecordType, SrvRecord, TxtRecord } from "../codec/DnsCodec";
import { Fabric } from "../fabric/Fabric";
import { getIpMacAddresses, getIpMacOnInterface } from "../util/Network";
import { UdpMulticastServer } from "../util/Udp";

const MDNS_BROADCAST_IP = "224.0.0.251";
const MDNS_BROADCAST_PORT = 5353;
const SERVICE_DISCOVERY_QNAME = "_services._dns-sd._udp.local";
const MATTER_SERVICE_QNAME = "_matter._tcp.local";

export class MdnsServer {
    static async create() {
        const multicastServer = await UdpMulticastServer.create(MDNS_BROADCAST_IP, MDNS_BROADCAST_PORT);
        return new MdnsServer(multicastServer);
    }

    constructor(
        private readonly multicastServer: UdpMulticastServer,
    ) {
        multicastServer.onMessage((message, remoteIp) => this.handleDnsMessage(message, remoteIp));
    }

    private readonly records = new Array<(ip: string, hostname: string) => Record<any>>();

    private handleDnsMessage(messageBytes: Buffer, remoteIp: string) {
        // No need to process the DNS message if there are no records to serve
        if (this.records.length === 0) return;

        const message = DnsCodec.decode(messageBytes);
        if (message.messageType !== MessageType.Query) return;

        const {ip, mac} = getIpMacOnInterface(remoteIp);
        const records = this.computeRecords(ip, mac);
        
        const answers = message.queries.flatMap(query => this.queryRecords(query, records));
        if (answers.length === 0) return;

        const additionalRecords = records.filter(record => !answers.includes(record));
        this.multicastServer.send(ip, DnsCodec.encode({ answers, additionalRecords }));
    }

    addRecordsForFabric(fabric: Fabric) {
        const nodeIdBuffer = Buffer.alloc(8);
        nodeIdBuffer.writeBigUInt64BE(BigInt(fabric.nodeId));
        const nodeId = nodeIdBuffer.toString("hex").toUpperCase();
        const fabricId = fabric.operationalId.toString("hex").toUpperCase();
        const fabricQname = `_I${fabricId}._sub.${MATTER_SERVICE_QNAME}`;
        const deviceMatterQname = `${fabricId}-${nodeId}.${MATTER_SERVICE_QNAME}`;
        this.records.length = 0;
        this.records.push.apply(this.records, [
            () => PtrRecord(SERVICE_DISCOVERY_QNAME, MATTER_SERVICE_QNAME),
            () => PtrRecord(SERVICE_DISCOVERY_QNAME, fabricQname),
            () => PtrRecord(MATTER_SERVICE_QNAME, deviceMatterQname),
            () => PtrRecord(fabricQname, deviceMatterQname),
            (ip, hostname) => ARecord(hostname, ip),
            // TODO: support IPv6
            // AAAARecord(this.localHostname, "fe80::9580:b733:6f54:9f43"),
            // TODO: the Matter port should not be hardcoded here
            (ip, hostname) => SrvRecord(deviceMatterQname, {priority: 0, weight: 0, port: 5540, target: hostname }),
            () => TxtRecord(deviceMatterQname, ["SII=5000", "SAI=300", "T=1"]),
        ]);
    }

    async announce() {
        await Promise.all(getIpMacAddresses().map(({ip, mac}) => {
            const records = this.computeRecords(ip, mac);
            const answers = records.filter(({recordType}) => recordType === RecordType.PTR);
            const additionalRecords = records.filter(({recordType}) => recordType !== RecordType.PTR);
            return this.multicastServer.send(ip, DnsCodec.encode({ answers, additionalRecords }));
        }));
    }

    private queryRecords({name, recordType}: {name: string, recordType: RecordType}, records: Record<any>[]) {
        if (recordType === RecordType.ANY) {
            return records.filter(record => record.name === name);
        } else {
            return records.filter(record => record.name === name && record.recordType === recordType);
        }
    }

    private computeRecords(ip: string, mac: string) {
        const hostname = mac.replace(/:/g, "").toUpperCase() + "0000.local";
        return this.records.map(recordProvider => recordProvider(ip, hostname));
    }
}
