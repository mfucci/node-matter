/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Field, JsType, ObjectT, StringT, Template, UnsignedIntT, UnsignedLongT, BooleanT } from "../../codec/TlvObjectCodec";
import { TlvType } from "../../codec/TlvCodec";
import { Attribute, Cluster, Command, NoArgumentsT, OptionalAttribute, WritableAttribute } from "./Cluster";

export const enum RegulatoryLocationType {
    Indoor = 0,
    Outdoor = 1,
    IndoorOutdoor = 2,
}
const RegulatoryLocationTypeT = { tlvType: TlvType.UnsignedInt } as Template<RegulatoryLocationType>;

export const enum CommissioningError {
    Ok = 0,
    ValueOutsideRange = 1,
    InvalidAuthentication = 2,
    NoFailSafe = 3,
    BusyWithOtherAdmin = 4,
}
const CommissioningErrorT = { tlvType: TlvType.UnsignedInt } as Template<CommissioningError>;

const BasicCommissioningInfoT = ObjectT({
    failSafeExpiryLengthSeconds: Field(0, UnsignedIntT),
    maxCumulativeFailsafeSeconds: Field(1, UnsignedIntT),
});

const CommissioningSuccessFailureResponseT = ObjectT({
    errorCode: Field(0, CommissioningErrorT),
    debugText: Field(1, StringT),
});
export type CommissioningSuccessFailureResponse = JsType<typeof CommissioningSuccessFailureResponseT>;

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UnsignedIntT),
    breadcrumbStep: Field(1, UnsignedLongT),
});

const SetRegulatoryConfigRequestT = ObjectT({
    config: Field(0, RegulatoryLocationTypeT),
    countryCode: Field(1, StringT),
    breadcrumbStep: Field(2, UnsignedLongT),
});

/**
 * This cluster is used to manage global aspects of the Commissioning flow.
 */
export const GeneralCommissioningCluster = Cluster(
    0x30,
    "General Commissioning",
    {
        breadcrumb: WritableAttribute(0, UnsignedLongT, BigInt(0)), /* readAcl: view, writeAcl: administer */
        commissioningInfo: Attribute(1, BasicCommissioningInfoT),
        regulatoryConfig: Attribute(2, RegulatoryLocationTypeT),
        locationCapability: Attribute(3, RegulatoryLocationTypeT),
        supportsConcurrentConnections: Attribute(4, BooleanT, true),
    },
    {
        /**
         * Arm the persistent fail-safe timer with an expiry time of now + ExpiryLengthSeconds using device clock
         */
        armFailSafe: Command(0, ArmFailSafeRequestT, 1, CommissioningSuccessFailureResponseT),
        /**
         * Set the regulatory configuration to be used during commissioning
         */
        updateRegulatoryConfig: Command(2, SetRegulatoryConfigRequestT, 3, CommissioningSuccessFailureResponseT),
        /**
         * Signals the Server that the Client has successfully completed all steps of Commissioning/Reconfiguration
         * needed during fail-safe period.
         */
        commissioningComplete: Command(4, NoArgumentsT, 5, CommissioningSuccessFailureResponseT),
    },
)
