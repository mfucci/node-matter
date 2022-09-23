/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { DnsCodec, DnsMessage, MessageType, Record, RecordType } from "../codec/DnsCodec";
import { Network } from "../net/Network";
import { UdpMulticastServer } from "../net/UdpMulticastServer";
import { Cache } from "../util/Cache";

export const MDNS_BROADCAST_IP = "224.0.0.251";
export const MDNS_BROADCAST_PORT = 5353;

export class MdnsServer {
    static async create(multicastInterface?: string) {
        return new MdnsServer(multicastInterface, await UdpMulticastServer.create({multicastInterface, broadcastAddress: MDNS_BROADCAST_IP, listeningPort: MDNS_BROADCAST_PORT}));
    }

    private readonly network = Network.get();
    private recordsGenerator: (ip: string, mac: string) => Record<any>[] = () => [];
    private readonly records = new Cache<Record<any>[]>((ip, mac) => this.recordsGenerator(ip, mac), 5 * 60 * 1000 /* 5mn */);

    constructor(
        private readonly multicastInterface: string | undefined,
        private readonly multicastServer: UdpMulticastServer,
    ) {
        multicastServer.onMessage((message, remoteIp) => this.handleDnsMessage(message, remoteIp));
    }

    private handleDnsMessage(messageBytes: Buffer, remoteIp: string) {
        const ipMac = this.network.getIpMacOnInterface(remoteIp);
        // This message was on a subnet not supported by this device
        if (ipMac === undefined) return;

        const { ip, mac } = ipMac;
        const records = this.records.get(ip, mac);

        // No need to process the DNS message if there are no records to serve
        if (records.length === 0) return;

        const message = DnsCodec.decode(messageBytes);
        if (message === undefined) return; // The message cannot be parsed
        if (message.messageType !== MessageType.Query) return;
        
        const answers = message.queries.flatMap(query => this.queryRecords(query, records));
        if (answers.length === 0) return;

        const additionalRecords = records.filter(record => !answers.includes(record));
        this.multicastServer.send(DnsCodec.encode({ answers, additionalRecords }), ip);
    }

    async announce() {
        await Promise.all(this.getIpMacsForAnnounce().map(({ip, mac}) => {
            const records = this.records.get(ip, mac);
            const answers = records.filter(({recordType}) => recordType === RecordType.PTR);
            const additionalRecords = records.filter(({recordType}) => recordType !== RecordType.PTR);
            return this.multicastServer.send(DnsCodec.encode({ answers, additionalRecords }), ip);
        }));
    }

    setRecordsGenerator(generator: (ip: string, mac: string) => Record<any>[]) {
        this.records.clear();
        this.recordsGenerator = generator;
    }

    close() {
        this.records.close();
        this.multicastServer.close();
    }

    private getIpMacsForAnnounce() {
        if (this.multicastInterface === undefined) return this.network.getIpMacAddresses();
        const ipMac = this.network.getIpMacOnInterface(this.multicastInterface);
        if (ipMac === undefined) return [];
        return [ipMac];
    }

    private queryRecords({name, recordType}: {name: string, recordType: RecordType}, records: Record<any>[]) {
        if (recordType === RecordType.ANY) {
            return records.filter(record => record.name === name);
        } else {
            return records.filter(record => record.name === name && record.recordType === recordType);
        }
    }
}
