/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { DnsCodec } from "../../src/codec/DnsCodec";
import { UdpChannelFake } from "../../src/net/fake/UdpChannelFake";
import { UdpChannel } from "../../src/net/UdpChannel";
import { MdnsBroadcaster} from "../../src/matter/mdns/MdnsBroadcaster";
import { bigintToBuffer } from "../../src/util/BigInt";
import { getPromiseResolver } from "../../src/util/Promises";
import { NetworkFake } from "../../src/net/fake/NetworkFake";
import { Network } from "../../src/net/Network";
import { MdnsScanner } from "../../src/matter/mdns/MdnsScanner";
import { Fabric } from "../../src/matter/fabric/Fabric";

const SERVER_IP = "192.168.200.1";
const SERVER_MAC = "00:B0:D0:63:C2:26";
const CLIENT_IP = "192.168.200.2";
const CLIENT_MAC = "CA:FE:00:00:BE:EF";

const serverNetwork = new NetworkFake([ {ip: SERVER_IP, mac: SERVER_MAC} ]);
const clientNetwork = new NetworkFake([ {ip: CLIENT_IP, mac: CLIENT_MAC} ]);

const OPERATIONAL_ID = bigintToBuffer(BigInt(24));
const NODE_ID = BigInt(1);

describe("MDNS", () => {
    var broadcaster: MdnsBroadcaster;
    var scanner: MdnsScanner;
    var channel: UdpChannel;

    beforeEach(async () => {
        Network.get = () => clientNetwork;
        scanner = await MdnsScanner.create(CLIENT_IP);

        Network.get = () => serverNetwork;
        broadcaster = await MdnsBroadcaster.create(SERVER_IP);

        Network.get = () => { throw new Error("Network should not be requested post creation") };
        channel = await UdpChannelFake.create({listeningPort: 5353, listeningAddress: "224.0.0.251"});
    });

    afterEach(() => {
        broadcaster.close();
        scanner.close();
        channel.close();
    });

    context("broadcaster", () => {
        it("it broadcasts the device fabric", async () => {
            const { promise, resolver } = await getPromiseResolver<Buffer>();
            channel.onData((peerAddress, peerPort, data) => resolver(data));

            broadcaster.setFabric(OPERATIONAL_ID, NODE_ID);
            await broadcaster.announce();

            const result = DnsCodec.decode(await promise);

            assert.deepEqual(result, {
                transactionId: 0,
                messageType: 33792,
                queries: [],
                answers: [
                    { name: '_services._dns-sd._udp.local', recordType: 12, recordClass: 1, ttl: 120, value: '_matter._tcp.local' },
                    { name: '_services._dns-sd._udp.local', recordType: 12, recordClass: 1, ttl: 120, value: '_I0000000000000018._sub._matter._tcp.local' },
                    { name: '_matter._tcp.local', recordType: 12, recordClass: 1, ttl: 120, value: '0000000000000018-0000000000000001._matter._tcp.local' },
                    { name: '_I0000000000000018._sub._matter._tcp.local', recordType: 12, recordClass: 1, ttl: 120, value: '0000000000000018-0000000000000001._matter._tcp.local' },
                ],
                authorities: [],
                additionalRecords: [
                    { name: '00B0D063C2260000.local', recordType: 1, recordClass: 1, ttl: 120, value: '192.168.200.1' },
                    { name: '0000000000000018-0000000000000001._matter._tcp.local', recordType: 33, recordClass: 1, ttl: 120, value: {priority: 0, weight: 0, port: 5540, target: '00B0D063C2260000.local'} },
                    { name: '0000000000000018-0000000000000001._matter._tcp.local', recordType: 16, recordClass: 1, ttl: 120, value: ["SII=5000", "SAI=300", "T=1"] },
                ]
            });
        });

        it("it should ignore MDNS messages on unsupported interfaces", async () => {
            const socketOnAnotherSubnet = await UdpChannelFake.create({ listeningPort: 5353, listeningAddress: "224.0.0.251", multicastInterface: "1.1.1.23" });

            await socketOnAnotherSubnet.send("224.0.0.251", 5353, Buffer.alloc(1, 0));

            socketOnAnotherSubnet.close();
        });
    });

    context("integration", () => {
        it("the client returns server record if it has been announced", async () => {
            broadcaster.setFabric(OPERATIONAL_ID, NODE_ID);
            await broadcaster.announce();

            const result = await scanner.findDevice({operationalId: OPERATIONAL_ID} as Fabric, NODE_ID);

            assert.deepEqual(result, { ip: SERVER_IP, port: 5540 });
        });

        it("the client asks for the server record if it has not been announced", async () => {
            broadcaster.setFabric(OPERATIONAL_ID, NODE_ID);

            const result = await scanner.findDevice({operationalId: OPERATIONAL_ID} as Fabric, NODE_ID);

            assert.deepEqual(result, { ip: SERVER_IP, port: 5540 });
        });
    });
});
