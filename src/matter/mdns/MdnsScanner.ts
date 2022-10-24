/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DnsCodec, MessageType, Record, RecordClass, RecordType, SrvRecordValue } from "../../codec/DnsCodec";
import { UdpMulticastServer } from "../../net/UdpMulticastServer";
import { MDNS_BROADCAST_IP, MDNS_BROADCAST_PORT } from "../../net/MdnsServer";
import { getDeviceMatterQname, MATTER_SERVICE_QNAME } from "./MdnsConsts";
import { getPromiseResolver } from "../../util/Promises";
import { Network } from "../../net/Network";
import { bigintToBuffer } from "../../util/BigInt";
import { MatterServer, Scanner } from "../common/Scanner";
import { Fabric } from "../fabric/Fabric";
import { Time, Timer } from "../../time/Time";

type MatterServerRecordWithExpire = MatterServer & { expires: number };

export class MdnsScanner implements Scanner {
    static async create(address?: string) {
        return new MdnsScanner(await UdpMulticastServer.create({listeningAddress: address, broadcastAddress: MDNS_BROADCAST_IP, listeningPort: MDNS_BROADCAST_PORT}));
    }

    private readonly network = Network.get();
    private readonly matterDeviceRecords = new Map<string, MatterServerRecordWithExpire>();
    private readonly recordWaiters = new Map<string, (record: MatterServer | undefined) => void>();
    private readonly periodicTimer: Timer;

    constructor(
        private readonly multicastServer: UdpMulticastServer,
    ) {
        multicastServer.onMessage((message, remoteIp) => this.handleDnsMessage(message, remoteIp));
        this.periodicTimer = Time.getPeriodicTimer(60 * 1000 /* 1 mn */, () => this.expire()).start();
    }

    async findDevice({operationalId}: Fabric, nodeId: bigint): Promise<MatterServer | undefined> {
        const nodeIdString = bigintToBuffer(nodeId).toString("hex").toUpperCase();
        const operationalIdString = operationalId.toString("hex").toUpperCase();
        const deviceMatterQname = getDeviceMatterQname(operationalIdString, nodeIdString);

        const record = this.matterDeviceRecords.get(deviceMatterQname);
        if (record !== undefined) return { ip: record.ip, port: record.port };

        const { promise, resolver } = await getPromiseResolver<MatterServer | undefined>();
        const timer = Time.getTimer(5 * 1000 /* 5 s*/, () => {
            this.recordWaiters.delete(deviceMatterQname);
            resolver(undefined);
        }).start();
        this.recordWaiters.set(deviceMatterQname, resolver);
        this.multicastServer.send(DnsCodec.encode({ queries: [{ name: deviceMatterQname, recordClass: RecordClass.IN, recordType: RecordType.SRV }]}));
        const result = await promise;
        timer.stop();
        return result;
    }

    close() {
        this.multicastServer.close();
        this.periodicTimer.stop();
        [...this.recordWaiters.values()].forEach(waiter => waiter(undefined));
    }

    private handleDnsMessage(messageBytes: Buffer, remoteIp: string) {
        const message = DnsCodec.decode(messageBytes);
        if (message === undefined) return; // The message cannot be parsed
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
