import { Cluster } from "../model/Cluster";
import { Attribute } from "../model/Attribute";
import { Field, JsType, ObjectT, StringT, UnsignedIntT } from "../codec/TlvObjectCodec";
import { Command, NoArgumentsT } from "../model/Command";

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

export class GeneralCommissioningCluster extends Cluster {
    private readonly attributes = {
        breadcrumb: new Attribute(0, "Breadcrumb", UnsignedIntT, 0),
        comminssioningInfo: new Attribute(1, "BasicCommissioningInfo", BasicCommissioningInfoT, {failSafeExpiryLengthSeconds: 60 /* 1mn */}),
        regulatoryConfig: new Attribute(2, "RegulatoryConfig", UnsignedIntT, RegulatoryLocationType.Indoor),
        locationCapbility: new Attribute(3, "LocationCapability", UnsignedIntT, RegulatoryLocationType.IndoorOutdoor),
    }

    constructor() {
        super(
            0x30,
            "General Commissioning",
            [
                new Command(0, 1, "ArmFailSafe", ArmFailSafeRequestT, SuccessFailureReponseT, request => this.handleArmFailSafeRequest(request)),
                new Command(2, 3, "SetRegulatoryConfig", SetRegulatoryConfigRequestT, SuccessFailureReponseT, request => this.setRegulatoryConfig(request)),
                new Command(4, 5, "CommissioningComplete", NoArgumentsT, SuccessFailureReponseT, () => this.handleCommissioningComplete()),
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
