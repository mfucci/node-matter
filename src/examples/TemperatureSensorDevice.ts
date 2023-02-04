#!/usr/bin/env node

/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */


import { singleton } from "../util/Singleton";
import { Time } from "../time/Time";
import { TimeNode } from "../time/TimeNode";
import { execSync } from "child_process";


Time.get = singleton(() => new TimeNode());

import { MatterDevice } from "../matter/MatterDevice";
import { UdpInterface } from "../net/UdpInterface";
import { SecureChannelProtocol } from "../matter/session/secure/SecureChannelProtocol";
import { PaseServer } from "../matter/session/secure/PaseServer";
import { Crypto } from "../crypto/Crypto";
import { CaseServer } from "../matter/session/secure/CaseServer";
import { ClusterServer, InteractionServer } from "../matter/interaction/InteractionServer";
import { BasicInformationCluster } from "../matter/cluster/BasicInformationCluster";
import { GeneralCommissioningCluster, RegulatoryLocationType } from "../matter/cluster/GeneralCommissioningCluster";
import { OperationalCredentialsCluster } from "../matter/cluster/OperationalCredentialsCluster";
import { DEVICE } from "../matter/common/DeviceTypes";
import { MdnsBroadcaster } from "../matter/mdns/MdnsBroadcaster";
import { Network } from "../net/Network";
import { NetworkNode } from "../net/node/NetworkNode";
import { commandExecutor } from "../util/CommandLine";
import { getFloatCommandResult } from "../util/CommandLine";
import { getParameter } from "../util/CommandLine";
import { TemperatureMeasurementCluster } from "../matter/cluster/TemperatureMeasurementCluster";
import { GeneralCommissioningClusterHandler } from "../matter/cluster/server/GeneralCommissioningServer";
import { OperationalCredentialsClusterHandler } from "../matter/cluster/server/OperationalCredentialsServer";
import { MdnsScanner } from "../matter/mdns/MdnsScanner";
import packageJson from "../../package.json";
import { Logger } from "../log/Logger";
import { VendorId } from "../matter/common/VendorId";
import { ByteArray } from "@project-chip/matter.js";
import { CommissionningFlowType, DiscoveryCapabilitiesSchema, ManualPairingCodeCodec, QrPairingCodeCodec } from "../codec/PairingCode.js";
import { QrCode } from "../codec/QrCode.js";
import { NetworkCommissioningCluster, NetworkCommissioningStatus } from "../matter/cluster/NetworkCommissioningCluster";
import { AdminCommissioningCluster, CommissioningWindowStatus } from "../matter/cluster/AdminCommissioningCluster";
import { AdminCommissioningHandler } from "../matter/cluster/server/AdminCommissioningServer";
import { NetworkCommissioningHandler } from "../matter/cluster/server/NetworkCommissioningServer";
import { FabricIndex } from "../matter/common/FabricIndex";

import { DevicePrivateKey } from "../certificates"
import { DeviceCertificate } from "../certificates"
import { ProductIntermediateCertificate } from "../certificates"
import { CertificateDeclaration } from "../certificates"


Network.get = singleton(() => new NetworkNode());


const logger = Logger.get("TemperatureSensor");

class TemperatureSensor {
    async start() {
        logger.info(`node-matter@${packageJson.version}`);

        const deviceName = "Matter Sensor device";
        const deviceType = DEVICE.TEMPERATURE_SENSOR.code ;
        const vendorName = "node-matter";
        const passcode = 20202021;
        const discriminator = 3840;
        // product name / id and vendor id should match what is in the device certificate
        const vendorId = new VendorId(0xFFF1);
        const productName = "Temperature Sensor";
        const productId = 0X8000;

        // Barebone implementation of the TemperatureMeasurement cluster
        const temperatureMeasurementClusterServer = new ClusterServer(
            TemperatureMeasurementCluster,
            { measuredValue: false },
            { measuredValue: 1, minMeasuredValue: -27315, maxMeasuredValue: 32767, tolerance: 1 },
             ({ }) //    TemperatureMeasurementClusterHandler()
        );

        // for testing: -temperature "echo \$RANDOM % 100 | bc"
        const temperatureScript = getParameter( "temperature" ) ?? "";

        // if we have a script to check temperature
        if ( temperatureScript ) {
           function temperatureIntervalCheck() {
              // scale as per 2.3.4.
              temperatureMeasurementClusterServer.attributes.measuredValue.set( getFloatCommandResult(temperatureScript) * 100 );
          }
          temperatureIntervalCheck();
          setInterval( temperatureIntervalCheck, 60000);
        }
        
        // hack to read weather data from a local Tempest weather station
        // FIXME - socket error processing
        if ( getParameter( "tempest" ) )
        {
           var udp = require('dgram');
           var server = udp.createSocket('udp4');
           server.bind(50222);

           // emits on datagram msg
           server.on('message',function(msg:Uint8Array,info:Uint8Array){
              const data=JSON.parse(msg.toString());
              if ( data.type == 'obs_st' ) {
                 // grab the temperature out of the returned data, scale for Matter spec.
                 temperatureMeasurementClusterServer.attributes.measuredValue.set( data.obs[0][7] * 100 );
              }
           });
        }

        const secureChannelProtocol = new SecureChannelProtocol(
            await PaseServer.fromPin(passcode, { iterations: 1000, salt: Crypto.getRandomData(32) }),
            new CaseServer(),
        );

        (new MatterDevice(deviceName, deviceType, vendorId, productId, discriminator))
            .addNetInterface(await UdpInterface.create(5540, "udp4"))
            .addNetInterface(await UdpInterface.create(5540, "udp6"))
            .addScanner(await MdnsScanner.create())
            .addBroadcaster(await MdnsBroadcaster.create())
            .addProtocolHandler(secureChannelProtocol)
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
                           caseSessionsPerFabric: 3,
                           subscriptionsPerFabric: 3,
                       },
                       serialNumber: `node-matter-${packageJson.version}`,
                   }, {}),
                   new ClusterServer(GeneralCommissioningCluster, {}, {
                       breadcrumb: BigInt(0),
                       commissioningInfo: {
                           failSafeExpiryLengthSeconds: 60 /* 1min */,
                           maxCumulativeFailsafeSeconds: 900 /* Recommended according to Specs */,
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
                       }),
                   ),
                   new ClusterServer(NetworkCommissioningCluster,
                        {
                            wifi: false,
                            thread: false,
                            ethernet: true,
                        },
                        {
                            maxNetworks: 1,
                            connectMaxTimeSeconds: 20,
                            interfaceEnabled: true,
                            lastConnectErrorValue: 0,
                            lastNetworkId: Buffer.alloc(32),
                            lastNetworkingStatus: NetworkCommissioningStatus.Success,
                            networks: [{ networkId: Buffer.alloc(32), connected: true }],
                            scanMaxTimeSeconds: 5,
                        },
                        NetworkCommissioningHandler(),
                    ),
                    new ClusterServer(AdminCommissioningCluster,
                        {
                            basic: true,
                        },
                        {
                            windowStatus: CommissioningWindowStatus.WindowNotOpen,
                            adminFabricIndex: null,
                            adminVendorId: null,
                        },
                        AdminCommissioningHandler(secureChannelProtocol),
                    )
                ])
                .addEndpoint(0x01, DEVICE.TEMPERATURE_SENSOR, [ temperatureMeasurementClusterServer ])
            )
            .start()

        logger.info("Listening");

        const qrPairingCode = QrPairingCodeCodec.encode({
            version: 0,
            vendorId: vendorId.id,
            productId,
            flowType: CommissionningFlowType.Standard,
            discriminator,
            passcode,
            discoveryCapabilities: DiscoveryCapabilitiesSchema.encode({
                ble: false,
                softAccessPoint: false,
                onIpNetwork: true,
            }),
        });
        console.log(QrCode.encode(qrPairingCode));
        console.log(`QR Code URL: https://project-chip.github.io/connectedhomeip/qrcode.html?data=${qrPairingCode}`);
        console.log(`Manual pairing code: ${ManualPairingCodeCodec.encode({ discriminator, passcode })}`);
    }
}

new TemperatureSensor().start();



