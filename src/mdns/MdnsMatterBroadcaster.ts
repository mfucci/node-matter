/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ARecord, PtrRecord, SrvRecord, TxtRecord } from "../codec/DnsCodec";
import { Crypto } from "../crypto/Crypto";
import { Broadcaster } from "../matter/common/Broadcaster";
import { bigintToBuffer } from "../util/BigInt";
import { getDeviceMatterQname, getFabricQname, MATTER_COMMISSION_SERVICE_QNAME, MATTER_SERVICE_QNAME, SERVICE_DISCOVERY_QNAME } from "./MdnsMatterConst";
import { MdnsServer } from "./MdnsServer";

export class MdnsMatterBroadcaster implements Broadcaster {
    static async create(multicastInterface?: string) {
        return new MdnsMatterBroadcaster(await MdnsServer.create(multicastInterface));
    }

    constructor(
        private readonly mdnsServer: MdnsServer,
    ) {}

    setCommissionMode(deviceName: string, deviceType: number, vendorId: number, productId: number, discriminator: number) {
        const shortDiscriminator = (discriminator >> 8) & 0x0F;
        const instanceId = Crypto.getRandomData(8).toString("hex").toUpperCase();
        const vendorQname = `_V${vendorId}._sub.${MATTER_COMMISSION_SERVICE_QNAME}`;
        const deviceTypeQname = `_T${deviceType}._sub.${MATTER_COMMISSION_SERVICE_QNAME}`;
        const shortDiscriminatorQname = `_S${shortDiscriminator}._sub.${MATTER_COMMISSION_SERVICE_QNAME}`;
        const longDiscriminatorQname = `_L${discriminator}._sub.${MATTER_COMMISSION_SERVICE_QNAME}`;
        const commissionModeQname = `_CM._sub.${MATTER_COMMISSION_SERVICE_QNAME}`;
        const deviceQname = `${instanceId}.${MATTER_COMMISSION_SERVICE_QNAME}`;
        this.mdnsServer.setRecordsGenerator((ip, mac) => {
            const hostname = mac.replace(/:/g, "").toUpperCase() + "0000.local";
            return [
                PtrRecord(SERVICE_DISCOVERY_QNAME, MATTER_COMMISSION_SERVICE_QNAME),
                PtrRecord(SERVICE_DISCOVERY_QNAME, vendorQname),
                PtrRecord(SERVICE_DISCOVERY_QNAME, deviceTypeQname),
                PtrRecord(SERVICE_DISCOVERY_QNAME, shortDiscriminatorQname),
                PtrRecord(SERVICE_DISCOVERY_QNAME, longDiscriminatorQname),
                PtrRecord(SERVICE_DISCOVERY_QNAME, commissionModeQname),
                PtrRecord(MATTER_COMMISSION_SERVICE_QNAME, deviceQname),
                PtrRecord(vendorQname, deviceQname),
                PtrRecord(deviceTypeQname, deviceQname),
                PtrRecord(shortDiscriminatorQname, deviceQname),
                PtrRecord(longDiscriminatorQname, deviceQname),
                PtrRecord(commissionModeQname, deviceQname),
                SrvRecord(deviceQname, {priority: 0, weight: 0, port: 5540, target: hostname }),
                ARecord(hostname, ip),
                // TODO: support IPv6
                TxtRecord(deviceQname, [
                    `VP=${vendorId}+${productId}`,  /* Vendor / Product */
                    `DT=${deviceType}`,             /* Device Type */
                    `DN=${deviceName}`,             /* Device Name */
                    "SII=5000",                     /* Sleepy Idle Interval */
                    "SAI=300",                      /* Sleepy Active Interval */
                    "T=1",                          /* TCP supported */
                    `D=${discriminator}`,           /* Discriminator */
                    "CM=1",                         /* Commission Mode */
                    "PH=33",                        /* Pairing Hint */
                    "PI=",                          /* Pairing Instruction */
                ]),
            ];
        });
    }

    setFabric(operationalId: Buffer, nodeId: bigint) {
        const nodeIdString = bigintToBuffer(nodeId).toString("hex").toUpperCase();
        const operationalIdString = operationalId.toString("hex").toUpperCase();
        const fabricQname = getFabricQname(operationalIdString);
        const deviceMatterQname = getDeviceMatterQname(operationalIdString, nodeIdString);

        this.mdnsServer.setRecordsGenerator((ip, mac) => {
            const hostname = mac.replace(/:/g, "").toUpperCase() + "0000.local";
            return [
                PtrRecord(SERVICE_DISCOVERY_QNAME, MATTER_SERVICE_QNAME),
                PtrRecord(SERVICE_DISCOVERY_QNAME, fabricQname),
                PtrRecord(MATTER_SERVICE_QNAME, deviceMatterQname),
                PtrRecord(fabricQname, deviceMatterQname),
                ARecord(hostname, ip),
                // TODO: support IPv6
                // AAAARecord(this.localHostname, "fe80::9580:b733:6f54:9f43"),
                // TODO: the Matter port should not be hardcoded here
                SrvRecord(deviceMatterQname, {priority: 0, weight: 0, port: 5540, target: hostname }),
                TxtRecord(deviceMatterQname, ["SII=5000", "SAI=300", "T=1"]),
            ];
        });
    }

    async announce() {
        await this.mdnsServer.announce();
    }

    close() {
        this.mdnsServer.close();
    }
}
