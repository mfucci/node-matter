/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    BoundedUnsignedIntT,
    ByteStringT,
    Field,
    ObjectT,
    OptionalField,
    UnsignedIntT
} from "../../../codec/TlvObjectCodec";
import { MatterCoreSpecificationV1_0 } from "../../../Specifications";

export const KDFSR1_KEY_INFO = Buffer.from("Sigma1_Resume");
export const KDFSR2_KEY_INFO = Buffer.from("Sigma2_Resume");
export const RESUME1_MIC_NONCE = Buffer.from("NCASE_SigmaS1");
export const RESUME2_MIC_NONCE = Buffer.from("NCASE_SigmaS2");
export const KDFSR2_INFO = Buffer.from("Sigma2");
export const KDFSR3_INFO = Buffer.from("Sigma3");
export const TBE_DATA2_NONCE = Buffer.from("NCASE_Sigma2N");
export const TBE_DATA3_NONCE = Buffer.from("NCASE_Sigma3N");

/** @see {@link MatterCoreSpecificationV1_0} § 3.5.1 */
const CRYPTO_GROUP_SIZE_BITS = 256;
const CRYPTO_GROUP_SIZE_BYTES = 32;
const CRYPTO_PUBLIC_KEY_SIZE_BYTES = (2 * CRYPTO_GROUP_SIZE_BYTES) + 1;

/** @see {@link MatterCoreSpecificationV1_0} § 3.3 */
const CRYPTO_HASH_LEN_BYTES = 32;
const CRYPTO_HASH_BLOCK_LEN_BYTES = 64;

/** @see {@link MatterCoreSpecificationV1_0} § 3.6 */
const CRYPTO_SYMMETRIC_KEY_LENGTH_BITS = 128;
const CRYPTO_SYMMETRIC_KEY_LENGTH_BYTES = 16;
const CRYPTO_AEAD_MIC_LENGTH_BITS = 128;
const CRYPTO_AEAD_MIC_LENGTH_BYTES = 16;
const CRYPTO_AEAD_NONCE_LENGTH_BYTES = 13;

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma1T = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })),
    destinationId: Field(3, ByteStringT({ length: CRYPTO_HASH_LEN_BYTES })),
    ecdhPublicKey: Field(4, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    mrpParams: OptionalField(5, ObjectT({ // sed-parameter-struct
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
    })),
    resumptionId: OptionalField(6, ByteStringT({ length: 16 })),
    resumeMic: OptionalField(7, ByteStringT({ length: CRYPTO_AEAD_MIC_LENGTH_BYTES})),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma2T = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })),
    ecdhPublicKey: Field(3, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    encrypted: Field(4, ByteStringT()),
    mrpParams: OptionalField(5, ObjectT({ // sed-parameter-struct
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
    })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma2ResumeT = ObjectT({
    resumptionId: Field(1, ByteStringT({ length: 16 })),
    resumeMic: Field(2, ByteStringT({ length: 16 })),
    sessionId: Field(3, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma3T = ObjectT({
    encrypted: Field(1, ByteStringT()),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const SignedDataT = ObjectT({
    newOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    ecdhPublicKey: Field(3, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    peerEcdhPublicKey: Field(4, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const EncryptedDataSigma2T = ObjectT({
    newOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    signature: Field(3, ByteStringT({length: CRYPTO_GROUP_SIZE_BYTES * 2})),
    resumptionId: Field(4, ByteStringT({ length: 16 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const EncryptedDataSigma3T = ObjectT({
    newOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    signature: Field(3, ByteStringT({ length: CRYPTO_GROUP_SIZE_BYTES * 2 })),
});
