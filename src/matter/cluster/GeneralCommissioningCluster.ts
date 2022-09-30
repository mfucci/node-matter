/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Field, JsType, ObjectT, StringT, Template, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { TlvType } from "../../codec/TlvCodec";
import { AttributeSpec, ClusterSpec, CommandSpec, NoArgumentsT } from "./ClusterSpec";

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

export const GeneralCommissioningClusterSpec = ClusterSpec(
    0x30,
    "General Commissioning",
    {
        breadcrumb: AttributeSpec(0, UnsignedIntT),
        comminssioningInfo: AttributeSpec(1, BasicCommissioningInfoT),
        regulatoryConfig: AttributeSpec(2, RegulatoryLocationTypeT),
        locationCapability: AttributeSpec(3, RegulatoryLocationTypeT),
    },
    {
        armFailSafe: CommandSpec(0, ArmFailSafeRequestT, 1, SuccessFailureReponseT),
        updateRegulatoryConfig: CommandSpec(2, SetRegulatoryConfigRequestT, 3, SuccessFailureReponseT),
        commissioningComplete: CommandSpec(4, NoArgumentsT, 5, SuccessFailureReponseT),
    },
)
