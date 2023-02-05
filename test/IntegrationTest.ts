/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";

import { Time } from "../src/time/Time";
import { TimeFake } from "../src/time/TimeFake";
import { UdpInterface } from "../src/net/UdpInterface";
import { MatterController } from "../src/matter/MatterController";
import { Crypto } from "../src/crypto/Crypto";
import { DEVICE } from "../src/matter/common/DeviceTypes";
import { ClusterServer, InteractionServer } from "../src/matter/interaction/InteractionServer";
import { MdnsBroadcaster } from "../src/matter/mdns/MdnsBroadcaster";
import { MatterDevice } from "../src/matter/MatterDevice";
import { CaseServer } from "../src/matter/session/secure/CaseServer";
import { SecureChannelProtocol as SecureChannelProtocol } from "../src/matter/session/secure/SecureChannelProtocol";
import { PaseServer } from "../src/matter/session/secure/PaseServer";
import { NetworkFake } from "../src/net/fake/NetworkFake";
import { Network } from "../src/net/Network";
import { MdnsScanner } from "../src/matter/mdns/MdnsScanner";
import { OnOffCluster } from "../src/matter/cluster/OnOffCluster";
import { BasicInformationCluster } from "../src/matter/cluster/BasicInformationCluster";
import { GeneralCommissioningCluster, RegulatoryLocationType } from "../src/matter/cluster/GeneralCommissioningCluster";
import { OperationalCredentialsCluster } from "../src/matter/cluster/OperationalCredentialsCluster";
import { GeneralCommissioningClusterHandler } from "../src/matter/cluster/server/GeneralCommissioningServer";
import { OperationalCredentialsClusterHandler } from "../src/matter/cluster/server/OperationalCredentialsServer";
import { ClusterClient } from "../src/matter/interaction/InteractionClient";
import { Level, Logger } from "../src/log/Logger";
import { getPromiseResolver } from "../src/util/Promises";
import { VendorId } from "../src/matter/common/VendorId";
import { NodeId } from "../src/matter/common/NodeId";
import { OnOffClusterHandler } from "../src/matter/cluster/server/OnOffServer";
import { ByteArray } from "@project-chip/matter.js";
import { FabricIndex } from "../src/matter/common/FabricIndex";
import {DescriptorCluster} from "../src/matter/cluster/DescriptorCluster";

const SERVER_IP = "192.168.200.1";
const SERVER_MAC = "00:B0:D0:63:C2:26";
const CLIENT_IP = "192.168.200.2";
const CLIENT_MAC = "CA:FE:00:00:BE:EF";

const serverNetwork = new NetworkFake(SERVER_MAC, [SERVER_IP]);
const clientNetwork = new NetworkFake(CLIENT_MAC, [CLIENT_IP]);

// From Chip-Test-DAC-FFF1-8000-0007-Key.der
const DevicePrivateKey = ByteArray.fromHex("727F1005CBA47ED7822A9D930943621617CFD3B79D9AF528B801ECF9F1992204");

// From Chip-Test-DAC-FFF1-8000-0007-Cert.der
const DeviceCertificate = ByteArray.fromHex("308201e83082018fa0030201020208143c9d1689f498f0300a06082a8648ce3d04030230463118301606035504030c0f4d617474657220546573742050414931143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303020170d3231303632383134323334335a180f39393939313233313233353935395a304b311d301b06035504030c144d6174746572205465737420444143203030303731143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303059301306072a8648ce3d020106082a8648ce3d0301070342000462e2b6e1baff8d74a6fd8216c4cb67a3363a31e691492792e61aee610261481396725ef95e142686ba98f339b0ff65bc338bec7b9e8be0bdf3b2774982476220a360305e300c0603551d130101ff04023000300e0603551d0f0101ff040403020780301d0603551d0e04160414ee95ad96983a9ea95bcd2b00dc5e671727690383301f0603551d23041830168014af42b7094debd515ec6ecf33b81115225f325288300a06082a8648ce3d040302034700304402202f51cf53bf7777df7318094b9db595eebf2fa881c8c572847b1e689ece654264022029782708ee6b32c7f08ff63dbe618e9a580bb14c183bc288777adf9e2dcff5e6");

// From Chip-Test-PAI-FFF1-8000-Cert.der
const ProductIntermediateCertificate = ByteArray.fromHex("308201d43082017aa00302010202083e6ce6509ad840cd300a06082a8648ce3d04030230303118301606035504030c0f4d617474657220546573742050414131143012060a2b0601040182a27c02010c04464646313020170d3231303632383134323334335a180f39393939313233313233353935395a30463118301606035504030c0f4d617474657220546573742050414931143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303059301306072a8648ce3d020106082a8648ce3d0301070342000480ddf11b228f3e31f63bcf5798da14623aebbde82ef378eeadbfb18fe1abce31d08ed4b20604b6ccc6d9b5fab64e7de10cb74be017c9ec1516056d70f2cd0b22a366306430120603551d130101ff040830060101ff020100300e0603551d0f0101ff040403020106301d0603551d0e04160414af42b7094debd515ec6ecf33b81115225f325288301f0603551d230418301680146afd22771f511fecbf1641976710dcdc31a1717e300a06082a8648ce3d040302034800304502210096c9c8cf2e01886005d8f5bc72c07b75fd9a57695ac4911131138bea033ce50302202554943be57d53d6c475f7d23ebfcfc2036cd29ba6393ec7efad8714ab718219");

// From DeviceAttestationCredsExample.cpp
const CertificateDeclaration = ByteArray.fromHex("3082021906092a864886f70d010702a082020a30820206020103310d300b06096086480165030402013082017106092a864886f70d010701a08201620482015e152400012501f1ff3602050080050180050280050380050480050580050680050780050880050980050a80050b80050c80050d80050e80050f80051080051180051280051380051480051580051680051780051880051980051a80051b80051c80051d80051e80051f80052080052180052280052380052480052580052680052780052880052980052a80052b80052c80052d80052e80052f80053080053180053280053380053480053580053680053780053880053980053a80053b80053c80053d80053e80053f80054080054180054280054380054480054580054680054780054880054980054a80054b80054c80054d80054e80054f80055080055180055280055380055480055580055680055780055880055980055a80055b80055c80055d80055e80055f80056080056180056280056380182403162c04135a494732303134325a423333303030332d32342405002406002507942624080018317d307b020103801462fa823359acfaa9963e1cfa140addf504f37160300b0609608648016503040201300a06082a8648ce3d04030204473045022024e5d1f47a7d7b0d206a26ef699b7c9757b72d469089de3192e678c745e7f60c022100f8aa2fa711fcb79b97e397ceda667bae464e2bd3ffdfc3cced7aa8ca5f4c1a7c");

const deviceName = "Matter end-to-end device";
const deviceType = 257 /* Dimmable bulb */;
const vendorName = "node-matter";
const vendorId = new VendorId(0xFFF1);
const productName = "Matter end-to-end device";
const productId = 0X8001;
const discriminator = 3840;
const setupPin = 20202021;
const matterPort = 5540;

const TIME_START = 1666663000000;
const fakeTime = new TimeFake(TIME_START);

describe("Integration", () => {
    var server: MatterDevice;
    var onOffServer: ClusterServer<any, any, any, any>;
    var client: MatterController;

    before(async () => {
        Logger.defaultLogLevel = Level.INFO;
        Time.get = () => fakeTime;
        Network.get = () => clientNetwork;
        client = await MatterController.create(
            await MdnsScanner.create(CLIENT_IP),
            await UdpInterface.create(5540, "udp4", CLIENT_IP),
            await UdpInterface.create(5540, "udp6", CLIENT_IP),
        );

        Network.get = () => serverNetwork;
        onOffServer = new ClusterServer(
            OnOffCluster,
            { lightingLevelControl: false },
            { onOff: false },
            OnOffClusterHandler()
        );
        server = new MatterDevice(deviceName, deviceType, vendorId, productId, discriminator)
            .addNetInterface(await UdpInterface.create(matterPort, "udp6", SERVER_IP))
            .addBroadcaster(await MdnsBroadcaster.create())
            .addProtocolHandler(new SecureChannelProtocol(
                    await PaseServer.fromPin(setupPin, { iterations: 1000, salt: Crypto.getRandomData(32) }),
                    new CaseServer(),
                ))
            .addProtocolHandler(new InteractionServer()
                .addEndpoint(0x00, DEVICE.ROOT, [
                    new ClusterServer(BasicInformationCluster, {}, {
                        dataModelRevision: 1,
                        vendorName,
                        vendorId,
                        productName,
                        productId,
                        nodeLabel: "",
                        hardwareVersion: 0,
                        hardwareVersionString: "0",
                        location: "US",
                        localConfigDisabled: false,
                        softwareVersion: 1,
                        softwareVersionString: "v1",
                        capabilityMinima: {
                            caseSessionsPerFabric: 100,
                            subscriptionsPerFabric: 100,
                        },
                    }, {}),
                    new ClusterServer(GeneralCommissioningCluster, {}, {
                        breadcrumb: BigInt(0),
                        commissioningInfo: {
                            failSafeExpiryLengthSeconds: 60 /* 1min */,
                            maxCumulativeFailsafeSeconds: 60 * 60 /* 1h */,
                        },
                        regulatoryConfig: RegulatoryLocationType.Indoor,
                        locationCapability: RegulatoryLocationType.IndoorOutdoor,
                        supportsConcurrentConnections: true,
                     }, GeneralCommissioningClusterHandler),
                     new ClusterServer(OperationalCredentialsCluster, {}, {
                             nocs: [],
                             fabrics: [],
                             supportedFabrics: 254,
                             commissionedFabrics: 0,
                             trustedRootCertificates: [],
                             currentFabricIndex: FabricIndex.NO_FABRIC,
                         },
                         OperationalCredentialsClusterHandler({
                             devicePrivateKey: DevicePrivateKey,
                             deviceCertificate: DeviceCertificate,
                             deviceIntermediateCertificate: ProductIntermediateCertificate,
                             certificateDeclaration: CertificateDeclaration,
                     })),
                ])
                .addEndpoint(0x01, DEVICE.ON_OFF_LIGHT, [ onOffServer ])
            );
        server.start();

        Network.get = () => { throw new Error("Network should not be requested post creation") };
    });

    context("commission", () => {
        it("the client commissions a new device", async () => {
            const nodeId = await client.commission(SERVER_IP, matterPort, discriminator, setupPin);

            assert.equal(nodeId.id, BigInt(1));
        });

        it("the session is resumed if it has been established previously", async () => {
            await client.connect(new NodeId(BigInt(1)));

            assert.ok(true);
        });
    });


    context("attributes", () => {
        it("get one specific attribute including schema parsing", async () => {
            const descriptorCluster = ClusterClient(await client.connect(new NodeId(BigInt(1))), 0, BasicInformationCluster);

            assert.equal(await descriptorCluster.getSoftwareVersionString(), "v1");
        });

        it("get all attributes", async () => {
            await (await client.connect(new NodeId(BigInt(1)))).getAllAttributes();

            assert.ok(true);
        });
    });

    context("subscription", () => {
        /*it("subscription sends regular updates", async () => {
            const interactionClient = await client.connect(BigInt(1));
            const onOffClient = ClusterClient(interactionClient, 1, OnOffCluster);
            const startTime = Time.nowMs();
            let lastReport: { value: boolean, version: number, time: number } | undefined;

            await onOffClient.subscribeOn((value, version) => lastReport = { value, version, time: Time.nowMs() }, 0, 5);
            await fakeTime.advanceTime(0);

            assert.deepEqual(lastReport, { value: false, version: 0, time: startTime});

            await fakeTime.advanceTime(8 * 1000);

            assert.deepEqual(lastReport, { value: false, version: 0, time: startTime + 5 * 1000});

            await fakeTime.advanceTime(5 * 1000);

            assert.deepEqual(lastReport, { value: false, version: 0, time: startTime + 10 * 1000});
        });*/

        it("subscription sends updates when the value changes", async () => {
            const interactionClient = await client.connect(new NodeId(BigInt(1)));
            const onOffClient = ClusterClient(interactionClient, 1, OnOffCluster);
            const startTime = Time.nowMs();
            let callback = (value: boolean, version: number) => {};
            await onOffClient.subscribeOnOff((value, version) => callback(value, version), 0, 5);
            await fakeTime.advanceTime(0);

            const { promise, resolver } = await getPromiseResolver<{value: boolean, version: number, time: number}>();
            callback = (value: boolean, version: number) => resolver({ value, version, time: Time.nowMs() });

            await fakeTime.advanceTime(2 * 1000);
            onOffServer.attributes.onOff.set(true);
            const lastReport = await promise;

            assert.deepEqual(lastReport, { value: true, version: 1, time: startTime + 2 * 1000});
        });
    });

    after(() => {
        server.stop();
        client.close();
    });
});
