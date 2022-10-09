/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT } from "../../../codec/TlvObjectCodec";

export const KDFSR1_KEY_INFO = Buffer.from("Sigma1_Resume");
export const KDFSR2_KEY_INFO = Buffer.from("Sigma2_Resume");
export const RESUME1_MIC_NONCE = Buffer.from("NCASE_SigmaR1");
export const RESUME2_MIC_NONCE = Buffer.from("NCASE_SigmaR2");
export const KDFSR2_INFO = Buffer.from("Sigma2");
export const KDFSR3_INFO = Buffer.from("Sigma3");
export const TBE_DATA2_NONCE = Buffer.from("NCASE_Sigma2N");
export const TBE_DATA3_NONCE = Buffer.from("NCASE_Sigma3N");

export const CaseSigma1T = ObjectT({
    random: Field(1, ByteStringT),
    sessionId: Field(2, UnsignedIntT),
    destinationId: Field(3, ByteStringT),
    ecdhPublicKey: Field(4, ByteStringT),
    mrpParams: OptionalField(5, ObjectT({
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
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
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
    })),
});

export const CaseSigma2ResumeT = ObjectT({
    resumptionId: Field(1, ByteStringT),
    resumeMic: Field(2, ByteStringT),
    sessionId: Field(3, UnsignedIntT),
});

export const CaseSigma3T = ObjectT({
    encrypted: Field(1, ByteStringT),
});

export const SignedDataT = ObjectT({
    newOpCert: Field(1, ByteStringT),
    intermediateCACert: OptionalField(2, ByteStringT),
    ecdhPublicKey: Field(3, ByteStringT),
    peerEcdhPublicKey: Field(4, ByteStringT),
});

export const EncryptedDataSigma2T = ObjectT({
    newOpCert: Field(1, ByteStringT),
    intermediateCACert: OptionalField(2, ByteStringT),
    signature: Field(3, ByteStringT),
    resumptionId: Field(4, ByteStringT),
});

export const EncryptedDataSigma3T = ObjectT({
    newOpCert: Field(1, ByteStringT),
    intermediateCACert: OptionalField(2, ByteStringT),
    signature: Field(3, ByteStringT),
});
