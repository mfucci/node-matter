import { ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT } from "../codec/TlvObjectCodec";

export const CaseSigma1T = ObjectT({
    random: Field(1, ByteStringT),
    sessionId: Field(2, UnsignedIntT),
    destinationId: Field(3, ByteStringT),
    ecdhPublicKey: Field(4, ByteStringT),
    mrpParams: OptionalField(5, ObjectT({
        idleRetransTimeout: OptionalField(1, UnsignedIntT),
        activeRetransTimeout: OptionalField(2, UnsignedIntT),
    })),
    resumptionId: OptionalField(6, ByteStringT),
    resumeMic: OptionalField(7, ByteStringT),
});

export const CaseSigma2T = ObjectT({
    random: Field(1, ByteStringT),
    sessionId: Field(2, UnsignedIntT),
    ecdhPublicKey: Field(3, ByteStringT),
    encrypted: Field(4, ByteStringT),
    mrpParams: OptionalField(5, ObjectT({
        idleRetransTimeout: OptionalField(1, UnsignedIntT),
        activeRetransTimeout: OptionalField(2, UnsignedIntT),
    })),
});

export const CaseSigma3T = ObjectT({
    encrypted: Field(1, ByteStringT),
});

export const TagBasedSignatureDataT = ObjectT({
    newOpCert: Field(1, ByteStringT),
    intermediateCACert: OptionalField(2, ByteStringT),
    ecdhPublicKey: Field(3, ByteStringT),
    peerEcdhPublicKey: Field(4, ByteStringT),
});

export const TagBasedEcryptionDataT = ObjectT({
    newOpCert: Field(1, ByteStringT),
    intermediateCACert: OptionalField(2, ByteStringT),
    signature: Field(3, ByteStringT),
    resumptionId: OptionalField(4, ByteStringT),
});
