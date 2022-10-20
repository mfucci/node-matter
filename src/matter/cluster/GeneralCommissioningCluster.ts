/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Field, JsType, ObjectT, StringT, Template, UnsignedIntT } from "../../codec/TlvObjectCodec";
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
});

const SuccessFailureReponseT = ObjectT({
    errorCode: Field(0, CommissioningErrorT),
    debugText: Field(1, StringT),
});
export type SuccessFailureReponse = JsType<typeof SuccessFailureReponseT>;

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UnsignedIntT),
    breadcrumbStep: Field(1, UnsignedIntT),
});

const SetRegulatoryConfigRequestT = ObjectT({
    config: Field(0, RegulatoryLocationTypeT),
    countryCode: Field(1, StringT),
    breadcrumbStep: Field(2, UnsignedIntT),
});

export const GeneralCommissioningCluster = Cluster(
    0x30,
    "General Commissioning",
    {
        breadcrumb: Attribute(0, UnsignedIntT),
        commissioningInfo: Attribute(1, BasicCommissioningInfoT),
        regulatoryConfig: Attribute(2, RegulatoryLocationTypeT),
        locationCapability: Attribute(3, RegulatoryLocationTypeT),
    },
    {
        armFailSafe: Command(0, ArmFailSafeRequestT, 1, SuccessFailureReponseT),
        updateRegulatoryConfig: Command(2, SetRegulatoryConfigRequestT, 3, SuccessFailureReponseT),
        commissioningComplete: Command(4, NoArgumentsT, 5, SuccessFailureReponseT),
    },
)
