import { ElementType, Field, OptionalField, Structure, ObjectMap } from "../codec/Tlv";
import { Tag } from "../models/Tag";

const { ByteString, UnsignedInt, Boolean } = ElementType;

export interface MrpParameters {
    idleRetransTimeout?: number,
    activeRetransTimeout?: number,
}

const MrpParametersMap: ObjectMap<MrpParameters> = {
    idleRetransTimeout: OptionalField(1, UnsignedInt),
    activeRetransTimeout: OptionalField(2, UnsignedInt),
};

export interface PbkdfParamRequest {
    initiatorRandom: Buffer,
    initiatorSessionId: number,
    passcodeId: number,
    hasPbkdfParameters: boolean,
    mrpParameters?: MrpParameters,
}

export const PbkdfParamRequestMessage = Structure<PbkdfParamRequest>(Tag.Anonymous, {
    initiatorRandom: Field(1, ByteString),
    initiatorSessionId: Field(2, UnsignedInt),
    passcodeId: Field(3, UnsignedInt),
    hasPbkdfParameters: Field(4, Boolean),
    mrpParameters: OptionalField(5, MrpParametersMap),
});

export interface PbkdfParameters {
    iteration: number,
    salt: Buffer,
}

export interface PbkdfParamResponse {
    initiatorRandom: Buffer,
    responderRandom: Buffer,
    responderSessionId: number,
    pbkdfParameters?: PbkdfParameters,
    mrpParameters?: MrpParameters,
}

export const PbkdfParamResponseMessage = Structure<PbkdfParamResponse>(Tag.Anonymous, {
    initiatorRandom: Field(1, ByteString),
    responderRandom: Field(2, ByteString),
    responderSessionId: Field(3, UnsignedInt),
    pbkdfParameters: OptionalField(4, {
        iteration: Field(1, UnsignedInt),
        salt: Field(2, ByteString),
    }),
    mrpParameters: OptionalField(5, MrpParametersMap),
});

export interface PasePake1 {
    x: Buffer,
}

export const PasePake1Message = Structure<PasePake1>(Tag.Anonymous, {
    x: Field(1, ByteString),
});

export interface PasePake2 {
    y: Buffer,
    verifier: Buffer,
}

export const PasePake2Message = Structure<PasePake2>(Tag.Anonymous, {
    y: Field(1, ByteString),
    verifier: Field(2, ByteString),
});

export interface PasePake3 {
    verifier: Buffer,
}

export const PasePake3Message = Structure<PasePake3>(Tag.Anonymous, {
    verifier: Field(1, ByteString),
});

export const StatusResponseMessage = Field(0, UnsignedInt);
