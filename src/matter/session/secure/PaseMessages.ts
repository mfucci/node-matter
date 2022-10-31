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
import { MatterCoreSpecificationV1_0 } from "../../../Specifications";

/** @see {@link MatterCoreSpecificationV1_0} § 3.3 */
const CRYPTO_HASH_LEN_BYTES = 32;
const CRYPTO_HASH_BLOCK_LEN_BYTES = 64;

/** @see {@link MatterCoreSpecificationV1_0} § 3.5.1 */
const CRYPTO_GROUP_SIZE_BITS = 256;
const CRYPTO_GROUP_SIZE_BYTES = 32;
const CRYPTO_PUBLIC_KEY_SIZE_BYTES = (2 * CRYPTO_GROUP_SIZE_BYTES) + 1;

/** @see {@link MatterCoreSpecificationV1_0} § 4.13.1.2 */
export const PbkdfParamRequestT = ObjectT({
    random: Field(1, ByteStringT({ length: 32 })),
    sessionId: Field(2, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })), // Specs: range: 16bits
    passcodeId: Field(3, BoundedUnsignedIntT({ min: 0, max: 0xFFFF })), // Specs: length: 16bits so min is 0x1000 ??
    hasPbkdfParameters: Field(4, BooleanT),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
    })),
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
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeoutMs: OptionalField(1, UnsignedIntT),
        activeRetransTimeoutMs: OptionalField(2, UnsignedIntT),
    })),
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
