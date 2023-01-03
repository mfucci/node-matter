/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvArray, BitFlag, TlvBoolean, TlvByteString, TlvEnum, TlvField, TlvInt32, TlvObject, TlvUInt8, TlvNullable } from "@project-chip/matter.js";
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
    revision: 1,
    features: {
        wifi: BitFlag(0),
        thread: BitFlag(1),
        ethernet: BitFlag(2),
    },

    attributes: {
        maxNetworks: Attribute(0, TlvUInt8), /* read = admin */
        networks: Attribute(1, TlvArray(TlvObject({
            networkId: TlvField(0, TlvByteString.bound({ length: 32 })),
            connected: TlvField(1, TlvBoolean),
        })), { default: [] }), /* read = admin */
        scanMaxTimeSeconds: Attribute(2, TlvUInt8),
        connectMaxTimeSeconds: Attribute(3, TlvUInt8),
        interfaceEnabled: WritableAttribute(4, TlvBoolean, { default: true }), /* write = admin */
        lastNetworkingStatus: Attribute(5, TlvNullable(TlvEnum<NetworkCommissioningStatus>()), { default: null }), /* read = admin */
        lastNetworkId: Attribute(6, TlvByteString.bound({ length: 32 })), /* read = admin */
        lastConnectErrorValue: Attribute(7, TlvInt32), /* read = admin */
    },

    commands: {
        // TODO
    },
});
