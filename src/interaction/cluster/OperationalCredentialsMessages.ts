/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT, UnsignedLongT } from "../../codec/TlvObjectCodec";

export const enum CertificateType {
    DeviceAttestation = 1,
    ProductAttestationIntermediate = 2,
}

export const RequestWithNonceT = ObjectT({
    nonce: Field(0, ByteStringT),
});

export const AttestationResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT),
});

export const CsrResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT),
});

export const CertificateChainRequestT = ObjectT({
    type: Field(0, UnsignedIntT),
});

export const CertificateChainResponseT = ObjectT({
    certificate: Field(0, ByteStringT),
});

export const AddNocRequestT = ObjectT({
    nocCert: Field(0, ByteStringT),
    icaCert: Field(1, ByteStringT),
    ipkValue: Field(2, ByteStringT),
    caseAdminNode: Field(3, UnsignedLongT),
    adminVendorId: Field(4, UnsignedIntT),
});

export const AddTrustedRootCertificateRequestT = ObjectT({
    certificate: Field(0, ByteStringT),
});

export const enum Status {
    Success = 0x00,
    InvalidPublicKey = 0x01,
    InvalidNodeOpId = 0x02,
    InvalidNOC = 0x03,
    MissingCsr = 0x04,
    TableFull = 0x05,
    InsufficientPrivilege = 0x08,
    FabricConflict = 0x09,
    LabelConflict = 0x0a,
    InvalidFabricIndex = 0x0b,
}

export const StatusResponseT = ObjectT({
    status: Field(0, UnsignedIntT),
    fabricIndex: OptionalField(1, UnsignedIntT),
    debugText: OptionalField(2, UnsignedIntT),
});

export const AttestationT = ObjectT({
    declaration: Field(1, ByteStringT),
    nonce: Field(2, ByteStringT),
    timestamp: Field(3, UnsignedIntT),
    firmwareInfo: OptionalField(4, ByteStringT),
});

export const CertificateSigningRequestT = ObjectT({
    csr: Field(1, ByteStringT),
    nonce: Field(2, ByteStringT),
    vendorReserved1: OptionalField(3, ByteStringT),
    vendorReserved2: OptionalField(4, ByteStringT),
    vendorReserved3: OptionalField(5, ByteStringT),
});
