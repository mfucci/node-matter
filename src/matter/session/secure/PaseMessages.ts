/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    BooleanT,
    BoundedUnsignedIntT,
    ByteStringT,
    Field,
    ObjectT,
    OptionalField,
    UnsignedIntT
} from "../../../codec/TlvObjectCodec";
import {
    CRYPTO_HASH_LEN_BYTES,
    CRYPTO_PUBLIC_KEY_SIZE_BYTES
} from "../../../crypto/Crypto";
import { MatterCoreSpecificationV1_0 } from "../../../Specifications";

/** @see {@link MatterCoreSpecificationV1_0} § 2.12.5 */
const SedParametersT = ObjectT({
    /** Maximum sleep interval of node when in idle mode. */
    idleRetransTimeoutMs: OptionalField(1, UnsignedIntT), /* default: 300ms */
    /** Maximum sleep interval of node when in active mode. */
    activeRetransTimeoutMs: OptionalField(2, UnsignedIntT), /* default: 300ms */
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PbkdfParamRequestT = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })), // Specs: range: 16bits
    passcodeId: Field(3, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })), // Specs: length: 16bits so min is 0x1000 ??
    hasPbkdfParameters: Field(4, BooleanT),
    mrpParameters: OptionalField(5, SedParametersT),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PbkdfParamResponseT = ObjectT({
    peerRandom: Field(1, ByteStringT({ length: 32 })),
    random: Field(2, ByteStringT({ length: 32 })),
    sessionId: Field(3, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })),
    pbkdfParameters: OptionalField(4, ObjectT({
        iteration: Field(1, UnsignedIntT),
        salt: Field(2, ByteStringT({ minLength: 16, maxLength: 32 })),
    })),
    mrpParameters: OptionalField(5, SedParametersT),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PasePake1T = ObjectT({
    x: Field(1, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PasePake2T = ObjectT({
    y: Field(1, ByteStringT({ length: CRYPTO_PUBLIC_KEY_SIZE_BYTES })),
    verifier: Field(2, ByteStringT({ length: CRYPTO_HASH_LEN_BYTES })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PasePake3T = ObjectT({
    verifier: Field(1, ByteStringT({ length: CRYPTO_HASH_LEN_BYTES })),
});
