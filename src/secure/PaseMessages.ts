import { BooleanT, ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT } from "../codec/TlvObjectCodec";

export const PbkdfParamRequestT = ObjectT({
    initiatorRandom: Field(1, ByteStringT),
    initiatorSessionId: Field(2, UnsignedIntT),
    passcodeId: Field(3, UnsignedIntT),
    hasPbkdfParameters: Field(4, BooleanT),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeout: OptionalField(1, UnsignedIntT),
        activeRetransTimeout: OptionalField(2, UnsignedIntT),
    })),
});

export const PbkdfParamResponseT = ObjectT({
    initiatorRandom: Field(1, ByteStringT),
    responderRandom: Field(2, ByteStringT),
    responderSessionId: Field(3, UnsignedIntT),
    pbkdfParameters: OptionalField(4, ObjectT({
        iteration: Field(1, UnsignedIntT),
        salt: Field(2, ByteStringT),
    })),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeout: OptionalField(1, UnsignedIntT),
        activeRetransTimeout: OptionalField(2, UnsignedIntT),
    })),
});

export const PasePake1T = ObjectT({
    x: Field(1, ByteStringT),
});

export const PasePake2T = ObjectT({
    y: Field(1, ByteStringT),
    verifier: Field(2, ByteStringT),
});

export const PasePake3T = ObjectT({
    verifier: Field(1, ByteStringT),
});
