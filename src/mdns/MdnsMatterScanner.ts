/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { DnsCodec, MessageType, Record, RecordClass, RecordType, SrvRecordValue } from "../codec/DnsCodec";
import { UdpMulticastServer } from "../net/UdpMulticastServer";
import { MDNS_BROADCAST_IP, MDNS_BROADCAST_PORT } from "./MdnsServer";
import { getDeviceMatterQname, MATTER_SERVICE_QNAME } from "./MdnsMatterConst";
import { getPromiseResolver } from "../util/Promises";
import { Network } from "../net/Network";
import { bigintToBuffer } from "../util/BigInt";
import { MatterDevice, Scanner } from "../matter/common/Scanner";

type MatterDeviceRecordWithExpire = MatterDevice & { expires: number };

export class MdnsMatterScanner implements Scanner {
    static async create(address?: string) {
        return new MdnsMatterScanner(await UdpMulticastServer.create({listeningAddress: address, broadcastAddress: MDNS_BROADCAST_IP, listeningPort: MDNS_BROADCAST_PORT}));
    }

    private readonly network = Network.get();
    private readonly matterDeviceRecords = new Map<string, MatterDeviceRecordWithExpire>();
    private readonly recordWaiters = new Map<string, (record: MatterDevice | undefined) => void>();
    private readonly intervalId: NodeJS.Timeout;

    constructor(
        private readonly multicastServer: UdpMulticastServer,
    ) {
        multicastServer.onMessage((message, remoteIp) => this.handleDnsMessage(message, remoteIp));
        this.intervalId = setInterval(() => this.expire(), 60 * 1000 /* 1 mn */);
    }

    async lookForDevice(operationalId: Buffer, nodeId: bigint): Promise<MatterDevice | undefined> {
        const nodeIdString = bigintToBuffer(nodeId).toString("hex").toUpperCase();
        const operationalIdString = operationalId.toString("hex").toUpperCase();
        const deviceMatterQname = getDeviceMatterQname(operationalIdString, nodeIdString);

        const record = this.matterDeviceRecords.get(deviceMatterQname);
        if (record !== undefined) return { ip: record.ip, port: record.port };

        const { promise, resolver } = await getPromiseResolver<MatterDevice | undefined>();
        const timeoutId = setTimeout(() => {
            this.recordWaiters.delete(deviceMatterQname);
            resolver(undefined);
        }, 5 * 1000 /* 5 s*/);
        this.recordWaiters.set(deviceMatterQname, resolver);
        this.multicastServer.send(DnsCodec.encode({ queries: [{ name: deviceMatterQname, recordClass: RecordClass.IN, recordType: RecordType.SRV }]}));
        const result = await promise;
        clearTimeout(timeoutId);
        return result;
    }

    close() {
        this.multicastServer.close();
        clearInterval(this.intervalId);
        [...this.recordWaiters.values()].forEach(waiter => waiter(undefined));
    }

    private handleDnsMessage(messageBytes: Buffer, remoteIp: string) {
        const { ip } = this.network.getIpMacOnInterface(remoteIp);

        const message = DnsCodec.decode(messageBytes);
        if (message.messageType !== MessageType.Response) return;


        const answers = [...message.answers, ...message.additionalRecords];
        const srvRecord = answers.find(({ name, recordType }) => recordType === RecordType.SRV && name.endsWith(MATTER_SERVICE_QNAME));
        if (srvRecord === undefined) return;
        const { name: matterName, ttl, value: { target, port: matterPort } } = (srvRecord as Record<SrvRecordValue>);
        const aRecord = answers.find(({ name, recordType }) => recordType === RecordType.A && name === target);
        if (aRecord === undefined) return;
        const matterIp = (aRecord as Record<string>).value;
        const record = { ip: matterIp, port: matterPort, expires: Date.now() + ttl * 1000 };
        this.matterDeviceRecords.set(matterName, record);

        const waiter = this.recordWaiters.get(matterName);
        if (waiter === undefined) return;
        waiter({ ip: matterIp, port: matterPort });
        this.recordWaiters.delete(matterName);
    }

    private expire() {
        const now = Date.now();
        [...this.matterDeviceRecords.entries()].forEach(([key, {expires}]) => {
            if (now < expires) return;
            this.matterDeviceRecords.delete(key);
        });
    }
}
