/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    CRYPTO_AEAD_MIC_LENGTH_BYTES,
    CRYPTO_GROUP_SIZE_BYTES,
    CRYPTO_HASH_LEN_BYTES,
    CRYPTO_PUBLIC_KEY_SIZE_BYTES
} from "../../../crypto/Crypto";
import { util, tlv } from "@project-chip/matter.js";

const CASE_SIGNATURE_LENGTH = CRYPTO_GROUP_SIZE_BYTES * 2;

export const KDFSR1_KEY_INFO = util.ByteArray.fromString("Sigma1_Resume");
export const KDFSR2_KEY_INFO = util.ByteArray.fromString("Sigma2_Resume");
export const RESUME1_MIC_NONCE = util.ByteArray.fromString("NCASE_SigmaS1");
export const RESUME2_MIC_NONCE = util.ByteArray.fromString("NCASE_SigmaS2");
export const KDFSR2_INFO = util.ByteArray.fromString("Sigma2");
export const KDFSR3_INFO = util.ByteArray.fromString("Sigma3");
export const TBE_DATA2_NONCE = util.ByteArray.fromString("NCASE_Sigma2N");
export const TBE_DATA3_NONCE = util.ByteArray.fromString("NCASE_Sigma3N");

/** @see {@link spec.MatterCoreSpecificationV1_0} § 2.12.5 */
const TlvSedParameters = tlv.Object({
    /** Maximum sleep interval of node when in idle mode. */
    idleRetransTimeoutMs: tlv.OptionalField(1, tlv.UInt32), /* default: 300ms */
    
    /** Maximum sleep interval of node when in active mode. */
    activeRetransTimeoutMs: tlv.OptionalField(2, tlv.UInt32), /* default: 300ms */
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvCaseSigma1 = tlv.Object({
    random: tlv.Field(1, tlv.ByteString.bound({ length: 32 })),
    sessionId: tlv.Field(2, tlv.UInt16),
    destinationId: tlv.Field(3, tlv.ByteString.bound({ length: CRYPTO_HASH_LEN_BYTES })),
    ecdhPublicKey: tlv.Field(4, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    mrpParams: tlv.OptionalField(5, TlvSedParameters),
    resumptionId: tlv.OptionalField(6, tlv.ByteString.bound({ length: 16 })),
    resumeMic: tlv.OptionalField(7, tlv.ByteString.bound({ length: CRYPTO_AEAD_MIC_LENGTH_BYTES})),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvCaseSigma2 = tlv.Object({
    random: tlv.Field(1, tlv.ByteString.bound({ length: 32 })),
    sessionId: tlv.Field(2, tlv.UInt16),
    ecdhPublicKey: tlv.Field(3, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    encrypted: tlv.Field(4, tlv.ByteString.bound({ maxLength: 400 })), // TODO: check max length in specs
    mrpParams: tlv.OptionalField(5, TlvSedParameters),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvCaseSigma2Resume = tlv.Object({
    resumptionId: tlv.Field(1, tlv.ByteString.bound({ length: 16 })),
    resumeMic: tlv.Field(2, tlv.ByteString.bound({ length: 16 })),
    sessionId: tlv.Field(3, tlv.UInt16),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvCaseSigma3 = tlv.Object({
    encrypted: tlv.Field(1, tlv.ByteString),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvSignedData = tlv.Object({
    nodeOpCert: tlv.Field(1, tlv.ByteString),
    intermediateCACert: tlv.OptionalField(2, tlv.ByteString),
    ecdhPublicKey: tlv.Field(3, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    peerEcdhPublicKey: tlv.Field(4, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvEncryptedDataSigma2 = tlv.Object({
    nodeOpCert: tlv.Field(1, tlv.ByteString),
    intermediateCACert: tlv.OptionalField(2, tlv.ByteString),
    signature: tlv.Field(3, tlv.ByteString.bound({length: CASE_SIGNATURE_LENGTH })),
    resumptionId: tlv.Field(4, tlv.ByteString.bound({ length: 16 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.2.3 */
export const TlvEncryptedDataSigma3 = tlv.Object({
    nodeOpCert: tlv.Field(1, tlv.ByteString),
    intermediateCACert: tlv.OptionalField(2, tlv.ByteString),
    signature: tlv.Field(3, tlv.ByteString.bound({ length: CASE_SIGNATURE_LENGTH })),
});
