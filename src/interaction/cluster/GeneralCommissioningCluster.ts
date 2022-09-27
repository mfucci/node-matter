/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cluster } from "../model/Cluster";
import { Field, JsType, ObjectT, StringT, Template, UnsignedIntT } from "../../codec/TlvObjectCodec";
import { NoArgumentsT } from "../model/Command";
import { MatterServer } from "../../matter/MatterServer";
import { AttributeDef, ClusterDef, CommandDef } from "./ClusterDef";
import { TlvType } from "../../codec/TlvCodec";
import { Session } from "../../session/Session";
import { SecureSession } from "../../session/SecureSession";

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

const ArmFailSafeRequestT = ObjectT({
    expiryLengthSeconds: Field(0, UnsignedIntT),
    breadcrumb: Field(1, UnsignedIntT),
});

const SetRegulatoryConfigRequestT = ObjectT({
    config: Field(0, RegulatoryLocationTypeT),
    countryCode: Field(1, StringT),
    breadcrumb: Field(2, UnsignedIntT),
});

type ArmFailSafeRequest = JsType<typeof ArmFailSafeRequestT>;
type SetRegulatoryConfigRequest = JsType<typeof SetRegulatoryConfigRequestT>;
export type SuccessFailureReponse = JsType<typeof SuccessFailureReponseT>;

const SuccessResponse = {errorCode: CommissioningError.Ok, debugText: ""};

// TODO: auto-generate this from GeneralCommissioningClusterDef
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
        this.addCommand(4, 5, "CommissioningComplete", NoArgumentsT, SuccessFailureReponseT, (request, session) => this.handleCommissioningComplete(session));

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

    private handleCommissioningComplete(session: Session<MatterServer>): SuccessFailureReponse {
        if (!session.isSecure()) throw new Error("commissioningComplete can only be called on a secure session");
        const fabric = (session as SecureSession<MatterServer>).getFabric();
        if (fabric === undefined) throw new Error("commissioningComplete is called but the fabric has not been defined yet");
        console.log(`Commissioning completed on fabric #${fabric.id} as node #${fabric.nodeId}.`)
        return SuccessResponse;
    }
}

export const GeneralCommissioningClusterDef = ClusterDef(
    0x30,
    "General Commissioning",
    {
        breadcrumb: AttributeDef(0, UnsignedIntT),
        comminssioningInfo: AttributeDef(1, BasicCommissioningInfoT),
        regulatoryConfig: AttributeDef(2, RegulatoryLocationTypeT),
        locationCapability: AttributeDef(3, RegulatoryLocationTypeT),
    },
    {
        armFailSafe: CommandDef(0, ArmFailSafeRequestT, 1, SuccessFailureReponseT),
        updateRegulatoryConfig: CommandDef(2, SetRegulatoryConfigRequestT, 3, SuccessFailureReponseT),
        commissioningComplete: CommandDef(4, NoArgumentsT, 5, SuccessFailureReponseT),
    },
)
