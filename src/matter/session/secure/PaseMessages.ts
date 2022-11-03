/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, ByteStringT, Field, ObjectT, OptionalField, UInt16T, UInt32T } from "../../../codec/DataModels";

export const PbkdfParamRequestT = ObjectT({
    random: Field(1, ByteStringT()),
    sessionId: Field(2, UInt16T),
    passcodeId: Field(3, UInt16T),
    hasPbkdfParameters: Field(4, BooleanT),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeoutMs: OptionalField(1, UInt32T),
        activeRetransTimeoutMs: OptionalField(2, UInt32T),
    })),
});

export const PbkdfParamResponseT = ObjectT({
    peerRandom: Field(1, ByteStringT()),
    random: Field(2, ByteStringT()),
    sessionId: Field(3, UInt16T),
    pbkdfParameters: OptionalField(4, ObjectT({
        iteration: Field(1, UInt32T),
        salt: Field(2, ByteStringT()),
    })),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeoutMs: OptionalField(1, UInt32T),
        activeRetransTimeoutMs: OptionalField(2, UInt32T),
    })),
});

export const PasePake1T = ObjectT({
    x: Field(1, ByteStringT()),
});

export const PasePake2T = ObjectT({
    y: Field(1, ByteStringT()),
    verifier: Field(2, ByteStringT()),
});

export const PasePake3T = ObjectT({
    verifier: Field(1, ByteStringT()),
});
