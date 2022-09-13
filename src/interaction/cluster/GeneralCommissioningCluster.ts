/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cluster } from "../model/Cluster";
import { Field, JsType, ObjectT, StringT, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { NoArgumentsT } from "../model/Command";
import { MatterServer } from "../../matter/MatterServer";

const enum RegulatoryLocationType {
    Indoor = 0,
    Outdoor = 1,
    IndoorOutdoor = 2,
}

const enum CommissioningError {
    Ok = 0,
    ValueOutsideRange = 1,
    InvalidAuthentication = 2,
    NoFailSafe = 3,
    BusyWithOtherAdmin = 4,
}

const BasicCommissioningInfoT = ObjectT({
    failSafeExpiryLengthSeconds: Field(0, UnsignedIntT),
});

const SuccessFailureReponseT = ObjectT({
    errorCode: Field(0, UnsignedIntT),
    debugText: Field(1, StringT),
});

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UnsignedIntT),
    breadcrumb: Field(1, UnsignedIntT),
});

const SetRegulatoryConfigRequestT = ObjectT({
    config: Field(0,UnsignedIntT),
    countryCode: Field(1, StringT),
    breadcrumb: Field(2, UnsignedIntT),
});

type ArmFailSafeRequest = JsType<typeof ArmFailSafeRequestT>;
type SetRegulatoryConfigRequest = JsType<typeof SetRegulatoryConfigRequestT>;
type SuccessFailureReponse = JsType<typeof SuccessFailureReponseT>;

const SuccessResponse = {errorCode: CommissioningError.Ok, debugText: ""};

export class GeneralCommissioningCluster extends Cluster<MatterServer> {
    static Builder = () => (endpointId: number) => new GeneralCommissioningCluster(endpointId);

    private readonly attributes;

    constructor(endpointId: number) {
        super(
            endpointId,
            0x30,
            "General Commissioning",
        );

        this.addCommand(0, 1, "ArmFailSafe", ArmFailSafeRequestT, SuccessFailureReponseT, request => this.handleArmFailSafeRequest(request));
        this.addCommand(2, 3, "SetRegulatoryConfig", SetRegulatoryConfigRequestT, SuccessFailureReponseT, request => this.setRegulatoryConfig(request));
        this.addCommand(4, 5, "CommissioningComplete", NoArgumentsT, SuccessFailureReponseT, () => this.handleCommissioningComplete());

        this.attributes = {
            breadcrumb: this.addAttribute(0, "Breadcrumb", UnsignedIntT, 0),
            comminssioningInfo: this.addAttribute(1, "BasicCommissioningInfo", BasicCommissioningInfoT, {failSafeExpiryLengthSeconds: 60 /* 1mn */}),
            regulatoryConfig: this.addAttribute(2, "RegulatoryConfig", UnsignedIntT, RegulatoryLocationType.Indoor),
            locationCapability: this.addAttribute(3, "LocationCapability", UnsignedIntT, RegulatoryLocationType.IndoorOutdoor),
        };
    }

    private handleArmFailSafeRequest({breadcrumb}: ArmFailSafeRequest): SuccessFailureReponse {
        this.attributes.breadcrumb.set(breadcrumb);
        return SuccessResponse;
    }

    private setRegulatoryConfig({breadcrumb, config}: SetRegulatoryConfigRequest): SuccessFailureReponse {
        this.attributes.breadcrumb.set(breadcrumb);
        this.attributes.regulatoryConfig.set(config);
        return SuccessResponse;
    }

    private handleCommissioningComplete(): SuccessFailureReponse {
        return SuccessResponse;
    }
}
