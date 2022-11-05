/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Bit, BitMapT, BooleanT, ByteStringT, EnumT, Field, ObjectT, UInt32T, UInt8T } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster, WritableAttribute } from "./Cluster";

export const enum NetworkCommissioningStatus {
    Success = 0,
    OutOfRange = 1,
    BoundsExceeded = 2,
    NetworkIDNotFound = 3,
    DuplicateNetworkID = 4,
    NetworkNotFound = 5,
    RegulatoryError = 6,
    AuthFailure = 7,
    UnsupportedSecurity = 8,
    OtherConnectionFailure = 9,
    IPV6Failed = 10,
    IPBindFailed = 11,
    UnknownError = 12,
}

export const NetworkCommissioningCluster = Cluster({
    id: 0x31,
    name: "Network Commissioning",
    attributes: {
        maxNetworks: Attribute(0, UInt8T), /* read = admin */
        networks: Attribute(1, ArrayT(ObjectT({
            networkId: Field(0, ByteStringT({ length: 32 })),
            connected: Field(1, BooleanT),
        })), { default: [] }), /* read = admin */
        scanMaxTimeSeconds: Attribute(2, UInt8T),
        connectMaxTimeSeconds: Attribute(3, UInt8T),
        interfaceEnabled: WritableAttribute(4, BooleanT), /* write = admin */
        lastNetworkingStatus: Attribute(5, EnumT<NetworkCommissioningStatus>()), /* read = admin */
        lastNetworkId: Attribute(6, ByteStringT({ length: 32 })), /* read = admin */
        lastConnectErrorValue: Attribute(7, UInt32T /* TODO: shoudl be signed 32 */), /* read = admin */
        featureMap: Attribute(0xFFFC, BitMapT({
            wifi: Bit(0),
            thread: Bit(1),
            ethernet: Bit(2),
        })),
    },
    commands: {
        // TODO
    },
});
