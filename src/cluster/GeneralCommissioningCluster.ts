import { Cluster } from "../model/Cluster";
import { Attribute } from "../model/Attribute";
import { PrimitiveType } from "../codec/TlvCodec";
import { Field, ObjectTemplate } from "../codec/TlvObjectCodec";
import { Command } from "../model/Command";

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

interface BasicCommissioningInfo {
    failSafeExpiryLengthSeconds: number,
}

const BasicCommissioningInfoTemplate = ObjectTemplate<BasicCommissioningInfo>({
    failSafeExpiryLengthSeconds: Field(0, PrimitiveType.UnsignedInt),
});

interface SuccessFailureReponse {
    errorCode: number,
    debugText: string,
}

const SuccessFailureReponseTemplate = ObjectTemplate<SuccessFailureReponse>({
    errorCode: Field(0, PrimitiveType.UnsignedInt),
    debugText: Field(1, PrimitiveType.String),
});

interface ArmFailSafeRequest {
    expiryLengthSeconds: number,
    breadcrumb: number,
}

const ArmFailSafeRequestTemplate = ObjectTemplate<ArmFailSafeRequest>({
    expiryLengthSeconds: Field(0, PrimitiveType.UnsignedInt),
    breadcrumb: Field(1, PrimitiveType.UnsignedInt),
});

interface SetRegulatoryConfigRequest {
    config: RegulatoryLocationType,
    countryCode: string,
    breadcrumb: number,
}

const SetRegulatoryConfigRequestTemplate = ObjectTemplate<SetRegulatoryConfigRequest>({
    config: Field(0, PrimitiveType.UnsignedInt),
    countryCode: Field(1, PrimitiveType.String),
    breadcrumb: Field(2, PrimitiveType.UnsignedInt),
});

const NoArgumentsTemplate = ObjectTemplate<{}>({});
const SuccessResponse = {errorCode: CommissioningError.Ok, debugText: ""};

export class GeneralCommissioningCluster extends Cluster {
    private readonly attributes = {
        breadcrumb: new Attribute(0, "Breadcrumb", PrimitiveType.UnsignedInt, 0),
        comminssioningInfo: new Attribute<BasicCommissioningInfo>(1, "BasicCommissioningInfo", BasicCommissioningInfoTemplate, {failSafeExpiryLengthSeconds: 60 /* 1mn */}),
        regulatoryConfig: new Attribute<RegulatoryLocationType>(2, "RegulatoryConfig", PrimitiveType.UnsignedInt, RegulatoryLocationType.Indoor),
        locationCapbility: new Attribute<RegulatoryLocationType>(3, "LocationCapability", PrimitiveType.UnsignedInt, RegulatoryLocationType.IndoorOutdoor),
    }

    constructor() {
        super(
            0x30,
            "General Commissioning",
            [
                new Command(0, "ArmFailSafe", ArmFailSafeRequestTemplate, SuccessFailureReponseTemplate, request => this.handleArmFailSafeRequest(request)),
                new Command(2, "SetRegulatoryConfig", SetRegulatoryConfigRequestTemplate, SuccessFailureReponseTemplate, request => this.setRegulatoryConfig(request)),
                new Command(4, "CommissioningComplete", NoArgumentsTemplate, SuccessFailureReponseTemplate, () => this.handleCommissioningComplete()),
            ],
        );

        this.addAttributes(Object.values(this.attributes));
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
