/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CRYPTO_HASH_LEN_BYTES, CRYPTO_PUBLIC_KEY_SIZE_BYTES } from "../../../crypto/Crypto";
import { tlv, spec } from "@project-chip/matter.js";

/** @see {@link spec.MatterCoreSpecificationV1_0} § 2.12.5 */
const TlvSedParameters = tlv.Object({
    /** Maximum sleep interval of node when in idle mode. */
    idleRetransTimeoutMs: tlv.OptionalField(1, tlv.UInt32), /* default: 300ms */

    /** Maximum sleep interval of node when in active mode. */
    activeRetransTimeoutMs: tlv.OptionalField(2, tlv.UInt32), /* default: 300ms */
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const TlvPbkdfParamRequest = tlv.Object({
    random: tlv.Field(1, tlv.ByteString.bound({ length: 32 })),
    sessionId: tlv.Field(2, tlv.UInt16), // Specs: range: 16bits
    passcodeId: tlv.Field(3, tlv.UInt16), // Specs: length: 16bits so min is 0x8000?
    hasPbkdfParameters: tlv.Field(4,  tlv.Boolean),
    mrpParameters: tlv.OptionalField(5, TlvSedParameters),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const TlvPbkdfParamResponse = tlv.Object({
    peerRandom: tlv.Field(1, tlv.ByteString.bound({ length: 32 })),
    random: tlv.Field(2, tlv.ByteString.bound({ length: 32 })),
    sessionId: tlv.Field(3, tlv.UInt16),
    pbkdfParameters: tlv.OptionalField(4, tlv.Object({
        iteration: tlv.Field(1, tlv.UInt32),
        salt: tlv.Field(2, tlv.ByteString.bound({ minLength: 16, maxLength: 32 })),
    })),
    mrpParameters: tlv.OptionalField(5, TlvSedParameters),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const TlvPasePake1 = tlv.Object({
    x: tlv.Field(1, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const TlvPasePake2 = tlv.Object({
    y: tlv.Field(1, tlv.ByteString.bound({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    verifier: tlv.Field(2, tlv.ByteString.bound({ length: CRYPTO_HASH_LEN_BYTES })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const TlvPasePake3 = tlv.Object({
    verifier: tlv.Field(1, tlv.ByteString.bound({ length: CRYPTO_HASH_LEN_BYTES })),
});
