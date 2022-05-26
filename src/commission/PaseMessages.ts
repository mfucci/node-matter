import { Field, ObjectTemplate, OptionalField } from "../codec/TlvObjectCodec";
import { PrimitiveType } from "../codec/TlvCodec";

const { ByteString, UnsignedInt, Boolean } = PrimitiveType;

export interface MrpParameters {
    idleRetransTimeout?: number,
    activeRetransTimeout?: number,
}

const MrpParametersTemplate = ObjectTemplate<MrpParameters>({
    idleRetransTimeout: OptionalField(1, UnsignedInt),
    activeRetransTimeout: OptionalField(2, UnsignedInt),
});

export interface PbkdfParamRequest {
    initiatorRandom: Buffer,
    initiatorSessionId: number,
    passcodeId: number,
    hasPbkdfParameters: boolean,
    mrpParameters?: MrpParameters,
}

export const PbkdfParamRequestTemplate = ObjectTemplate<PbkdfParamRequest>({
    initiatorRandom: Field(1, ByteString),
    initiatorSessionId: Field(2, UnsignedInt),
    passcodeId: Field(3, UnsignedInt),
    hasPbkdfParameters: Field(4, Boolean),
    mrpParameters: OptionalField(5, MrpParametersTemplate),
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

export const PbkdfParamResponseTemplate = ObjectTemplate<PbkdfParamResponse>({
    initiatorRandom: Field(1, ByteString),
    responderRandom: Field(2, ByteString),
    responderSessionId: Field(3, UnsignedInt),
    pbkdfParameters: OptionalField(4, ObjectTemplate<PbkdfParameters>({
        iteration: Field(1, UnsignedInt),
        salt: Field(2, ByteString),
    })),
    mrpParameters: OptionalField(5, MrpParametersTemplate),
});

export interface PasePake1 {
    x: Buffer,
}

export const PasePake1Template = ObjectTemplate<PasePake1>({
    x: Field(1, ByteString),
});

export interface PasePake2 {
    y: Buffer,
    verifier: Buffer,
}

export const PasePake2Template = ObjectTemplate<PasePake2>({
    y: Field(1, ByteString),
    verifier: Field(2, ByteString),
});

export interface PasePake3 {
    verifier: Buffer,
}

export const PasePake3Template = ObjectTemplate<PasePake3>({
    verifier: Field(1, ByteString),
});
