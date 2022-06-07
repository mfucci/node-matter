/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvType } from "../codec/TlvCodec";
import { ArrayT, BooleanT, ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT, UnsignedLongT } from "../codec/TlvObjectCodec";

export const CertificateT = ObjectT({
    serialNumber: Field(1, ByteStringT),
    signatureAlgorithm: Field(2, UnsignedIntT),
    issuer: Field(3, ObjectT({
        rcacId: Field(20, UnsignedIntT),
    }, TlvType.List)),
    notBefore: Field(4, UnsignedIntT),
    notAfter: Field(5, UnsignedIntT),
    subject: Field(6, ObjectT({
        rcacId: OptionalField(20, UnsignedIntT),
        fabricId: OptionalField(21, UnsignedLongT),
        nodeId: OptionalField(17, UnsignedLongT),
    }, TlvType.List)),
    publicKeyAlgorithm: Field(7, UnsignedIntT),
    ellipticCurveIdentifier: Field(8, UnsignedIntT),
    ellipticCurvePublicKey: Field(9, ByteStringT),
    extensions: Field(10, ObjectT({
        basicConstraints: Field(1,  ObjectT({
            isCa: Field(1, BooleanT),
            pathLen: OptionalField(2, UnsignedIntT),
        })),
        keyUsage: Field(2, UnsignedIntT),
        extendedKeyUsage: OptionalField(3, ArrayT(UnsignedIntT)),
        subjectKeyIdentifier: Field(4, ByteStringT),
        authorityKeyIdentifier: Field(5, ByteStringT),
        futureExtension: OptionalField(6, ByteStringT),
    }, TlvType.List)),
    signature: Field(11, ByteStringT),
});
