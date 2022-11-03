/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Field, JsType, ObjectT, StringT, BooleanT, EnumT, UInt64T, UInt16T } from "../../codec/TlvObjectCodec";
import { AccessLevel, Attribute, Cluster, Command, NoArgumentsT, WritableAttribute } from "./Cluster";

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
    failSafeExpiryLengthSeconds: Field(0, UInt16T),
    maxCumulativeFailsafeSeconds: Field(1, UInt16T),
});

const CommissioningSuccessFailureResponseT = ObjectT({
    errorCode: Field(0, EnumT<CommissioningError>()),
    debugText: Field(1, StringT()), // TODO: find the max of this from the specs
});
export type CommissioningSuccessFailureResponse = JsType<typeof CommissioningSuccessFailureResponseT>;

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UInt16T), /* default: 900 */
    breadcrumbStep: Field(1, UInt64T),
});

const SetRegulatoryConfigRequestT = ObjectT({
    newRegulatoryConfig: Field(0, EnumT<RegulatoryLocationType>()),
    countryCode: Field(1, StringT({ length: 2 })),
    breadcrumbStep: Field(2, UInt64T),
});

/**
 * This cluster is used to manage global aspects of the Commissioning flow.
 */
export const GeneralCommissioningCluster = Cluster({
    id: 0x30,
    name: "General Commissioning",
    attributes: {
        breadcrumb: WritableAttribute(0, UInt64T, { default: BigInt(0), writeAcl: AccessLevel.Administer }),
        commissioningInfo: Attribute(1, BasicCommissioningInfoT),
        regulatoryConfig: Attribute(2, EnumT<RegulatoryLocationType>()), /* default: value of locationCapability */
        locationCapability: Attribute(3, EnumT<RegulatoryLocationType>(), { default: RegulatoryLocationType.IndoorOutdoor }),
        supportsConcurrentConnections: Attribute(4, BooleanT, { default: true }),
    },
    commands: {
        /** Arms the persistent fail-safe timer with an expiry time of now + ExpiryLengthSeconds using device clock. */
        armFailSafe: Command(0, ArmFailSafeRequestT, 1, CommissioningSuccessFailureResponseT),

        /** Sets or Updates the regulatory configuration to be used during commissioning. */
        setRegulatoryConfig: Command(2, SetRegulatoryConfigRequestT, 3, CommissioningSuccessFailureResponseT),

        /**
         * Informs that all steps of Commissioning/Reconfiguration needed during the fail-safe period have been
         * completed.
         */
        commissioningComplete: Command(4, NoArgumentsT, 5, CommissioningSuccessFailureResponseT),
    },
});
