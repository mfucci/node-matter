/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { DnsCodec, MessageType, Record, RecordType } from "../codec/DnsCodec";
import { getIpMacAddresses, getIpMacOnInterface } from "../util/Network";
import { UdpMulticastServer } from "../io/udp/UdpMulticastServer";
import { Cache } from "../util/Cache";

const MDNS_BROADCAST_IP = "224.0.0.251";
const MDNS_BROADCAST_PORT = 5353;

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


    private recordsGenerator: (ip: string, mac: string) => Record<any>[] = () => [];
    private readonly records = new Cache<Record<any>[]>((ip, mac) => this.recordsGenerator(ip, mac), 5 * 60 * 1000 /* 5mn */);

    private handleDnsMessage(messageBytes: Buffer, remoteIp: string) {
        const {ip, mac} = getIpMacOnInterface(remoteIp);
        const records = this.records.get(ip, mac);

        // No need to process the DNS message if there are no records to serve
        if (records.length === 0) return;

        const message = DnsCodec.decode(messageBytes);
        if (message.messageType !== MessageType.Query) return;
        
        const answers = message.queries.flatMap(query => this.queryRecords(query, records));
        if (answers.length === 0) return;

        const additionalRecords = records.filter(record => !answers.includes(record));
        this.multicastServer.send(ip, DnsCodec.encode({ answers, additionalRecords }));
    }

    async announce() {
        await Promise.all(getIpMacAddresses().map(({ip, mac}) => {
            const records = this.records.get(ip, mac);
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

    setRecordsGenerator(generator: (ip: string, mac: string) => Record<any>[]) {
        this.records.clear();
        this.recordsGenerator = generator;
    }
}
