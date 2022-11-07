/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteStringT, Field, ObjectT, OptionalField, UInt16T, UInt32T } from "../../../codec/TlvObjectCodec";
import {
    CRYPTO_AEAD_MIC_LENGTH_BYTES,
    CRYPTO_GROUP_SIZE_BYTES,
    CRYPTO_HASH_LEN_BYTES,
    CRYPTO_PUBLIC_KEY_SIZE_BYTES
} from "../../../crypto/Crypto";
const CASE_SIGNATURE_LENGTH = CRYPTO_GROUP_SIZE_BYTES * 2;

export const KDFSR1_KEY_INFO = Buffer.from("Sigma1_Resume");
export const KDFSR2_KEY_INFO = Buffer.from("Sigma2_Resume");
export const RESUME1_MIC_NONCE = Buffer.from("NCASE_SigmaS1");
export const RESUME2_MIC_NONCE = Buffer.from("NCASE_SigmaS2");
export const KDFSR2_INFO = Buffer.from("Sigma2");
export const KDFSR3_INFO = Buffer.from("Sigma3");
export const TBE_DATA2_NONCE = Buffer.from("NCASE_Sigma2N");
export const TBE_DATA3_NONCE = Buffer.from("NCASE_Sigma3N");

/** @see {@link MatterCoreSpecificationV1_0} § 2.12.5 */
const SedParametersT = ObjectT({
    /** Maximum sleep interval of node when in idle mode. */
    idleRetransTimeoutMs: OptionalField(1, UInt32T), /* default: 300ms */
    /** Maximum sleep interval of node when in active mode. */
    activeRetransTimeoutMs: OptionalField(2, UInt32T), /* default: 300ms */
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma1T = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, UInt16T),
    destinationId: Field(3, ByteStringT({ length: CRYPTO_HASH_LEN_BYTES })),
    ecdhPublicKey: Field(4, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    mrpParams: OptionalField(5, SedParametersT),
    resumptionId: OptionalField(6, ByteStringT({ length: 16 })),
    resumeMic: OptionalField(7, ByteStringT({ length: CRYPTO_AEAD_MIC_LENGTH_BYTES})),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma2T = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, UInt16T),
    ecdhPublicKey: Field(3, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    encrypted: Field(4, ByteStringT({ maxLength: 400 })), // TODO: check max length in specs
    mrpParams: OptionalField(5, SedParametersT),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma2ResumeT = ObjectT({
    resumptionId: Field(1, ByteStringT({ length: 16 })),
    resumeMic: Field(2, ByteStringT({ length: 16 })),
    sessionId: Field(3, UInt16T),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const CaseSigma3T = ObjectT({
    encrypted: Field(1, ByteStringT()),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const SignedDataT = ObjectT({
    nodeOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    ecdhPublicKey: Field(3, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    peerEcdhPublicKey: Field(4, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const EncryptedDataSigma2T = ObjectT({
    nodeOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    signature: Field(3, ByteStringT({length: CASE_SIGNATURE_LENGTH })),
    resumptionId: Field(4, ByteStringT({ length: 16 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const EncryptedDataSigma3T = ObjectT({
    nodeOpCert: Field(1, ByteStringT()),
    intermediateCACert: OptionalField(2, ByteStringT()),
    signature: Field(3, ByteStringT({ length: CASE_SIGNATURE_LENGTH })),
});
