/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";

import { ARecord, DnsCodec, DnsMessage, MessageType, PtrRecord, Record, RecordType, SrvRecord, TxtRecord } from "../codec/DnsCodec";
import { Fabric } from "../fabric/Fabric";
import { getIpMacAddresses } from "../util/Network";
import { Singleton } from "../util/Singleton";

const MDNS_BROADCAST_IP = "224.0.0.251";
const MDNS_BROADCAST_PORT = 5353;
const SERVICE_DISCOVERY_QNAME = "_services._dns-sd._udp.local";
const MATTER_SERVICE_QNAME = "_matter._tcp.local";

export const getMdnsServer = Singleton(() => new MdnsServer());

export class MdnsServer {
    private readonly server = dgram.createSocket({type: "udp4", reuseAddr: true});
    private readonly records = new Array<Record<any>>();
    private readonly ip: string;
    private readonly localHostname: string; 

    constructor() {
        const { ip, mac } = getIpMacAddresses();
        this.ip = ip;
        this.localHostname = mac.replace(/:/g, "").toUpperCase() + "0000.local";
    }

    start() {
        this.server.on('message', message => this.handleDnsMessage(message));
        this.server.on('listening', () => this.server.setBroadcast(true));
        this.server.bind(MDNS_BROADCAST_PORT, MDNS_BROADCAST_IP);
    }

    private handleDnsMessage(messageBytes: Buffer) {
        const message = DnsCodec.decode(messageBytes);
        if (message.messageType !== MessageType.Query) return;
        const answers = message.queries.flatMap(({name, recordType}) => this.records.filter(record => record.name === name && record.recordType === recordType));
        if (answers.length === 0) return;
        this.send({
            answers,
            additionalRecords: this.records.filter(({recordType}) => recordType !== RecordType.PTR),
        });
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
            PtrRecord(SERVICE_DISCOVERY_QNAME, MATTER_SERVICE_QNAME),
            PtrRecord(SERVICE_DISCOVERY_QNAME, fabricQname),
            PtrRecord(MATTER_SERVICE_QNAME, deviceMatterQname),
            PtrRecord(fabricQname, deviceMatterQname),
            ARecord(this.localHostname, this.ip),
            //AAAARecord(this.localHostname, "fe80::9580:b733:6f54:9f43"),
            SrvRecord(deviceMatterQname, {priority: 0, weight: 0, port: 5540, target: this.localHostname }),
            TxtRecord(deviceMatterQname, ["SII=5000", "SAI=300", "T=1"]),
        ]);
    }

    async announce() {
        return this.send({
            answers: this.records.filter(({recordType}) => recordType === RecordType.PTR),
            additionalRecords: this.records.filter(({recordType}) => recordType !== RecordType.PTR),
        });
    }
    
    private async send(message: Partial<DnsMessage>) {
        return new Promise<void>((resolver, rejecter) => this.server.send(DnsCodec.encode(message), MDNS_BROADCAST_PORT, MDNS_BROADCAST_IP, error => {
            if (error !== null) rejecter(error);
            resolver();
        }));
    }
}
