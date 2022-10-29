/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Field, JsType, ObjectT, StringT, UnsignedIntT, UnsignedLongT, BooleanT, EnumT } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster, Command, NoArgumentsT, WritableAttribute } from "./Cluster";

export const enum RegulatoryLocationType {
    Indoor = 0,
    Outdoor = 1,
    IndoorOutdoor = 2,
}

export const enum CommissioningError {
    Ok = 0,
    ValueOutsideRange = 1,
    InvalidAuthentication = 2,
    NoFailSafe = 3,
    BusyWithOtherAdmin = 4,
}

const BasicCommissioningInfoT = ObjectT({
    failSafeExpiryLengthSeconds: Field(0, UnsignedIntT),
    maxCumulativeFailsafeSeconds: Field(1, UnsignedIntT),
});

const CommissioningSuccessFailureResponseT = ObjectT({
    errorCode: Field(0, EnumT<CommissioningError>()),
    debugText: Field(1, StringT),
});
export type CommissioningSuccessFailureResponse = JsType<typeof CommissioningSuccessFailureResponseT>;

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UnsignedIntT), /* default: 900 */
    breadcrumbStep: Field(1, UnsignedLongT),
});

const SetRegulatoryConfigRequestT = ObjectT({
    newRegulatoryConfig: Field(0, EnumT<RegulatoryLocationType>()),
    countryCode: Field(1, StringT), /* length: 2 */
    breadcrumbStep: Field(2, UnsignedLongT),
});

/**
 * This cluster is used to manage global aspects of the Commissioning flow.
 */
export const GeneralCommissioningCluster = Cluster(
    0x30,
    "General Commissioning",
    {
        breadcrumb: WritableAttribute(0, UnsignedLongT, BigInt(0)), /* writeAcl: administer */
        commissioningInfo: Attribute(1, BasicCommissioningInfoT),
        regulatoryConfig: Attribute(2, EnumT<RegulatoryLocationType>()), /* default: value of locationCapability */
        locationCapability: Attribute(3, EnumT<RegulatoryLocationType>(), RegulatoryLocationType.IndoorOutdoor),
        supportsConcurrentConnections: Attribute(4, BooleanT, true),
    },
    {
        /**
         * Arm the persistent fail-safe timer with an expiry time of now + ExpiryLengthSeconds using device clock.
         */
        armFailSafe: Command(0, ArmFailSafeRequestT, 1, CommissioningSuccessFailureResponseT),
        /**
         * Sets or Updates the regulatory configuration to be used during commissioning.
         */
        setRegulatoryConfig: Command(2, SetRegulatoryConfigRequestT, 3, CommissioningSuccessFailureResponseT),
        /**
         * Informs that all steps of Commissioning/Reconfiguration needed during the fail-safe period have been
         * completed.
         */
        commissioningComplete: Command(4, NoArgumentsT, 5, CommissioningSuccessFailureResponseT),
    },
)
