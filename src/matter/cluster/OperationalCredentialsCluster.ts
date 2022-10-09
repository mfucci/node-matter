/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClusterSpec, CommandSpec, NoResponseT } from "./ClusterSpec";
import { TlvType } from "../../codec/TlvCodec";
import { ByteStringT, Field, ObjectT, OptionalField, Template, UnsignedIntT, UnsignedLongT } from "../../codec/TlvObjectCodec";

export const enum CertificateType {
    DeviceAttestation = 1,
    ProductAttestationIntermediate = 2,
}
export const CertificateTypeT = { tlvType: TlvType.UnsignedInt } as Template<CertificateType>;

export const RequestWithNonceT = ObjectT({
    nonce: Field(0, ByteStringT),
});

export const AttestationResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT),
});

export const CertSigningRequestResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT),
});

export const CertChainRequestT = ObjectT({
    type: Field(0, CertificateTypeT),
});

export const CertChainResponseT = ObjectT({
    certificate: Field(0, ByteStringT),
});

export const AddNocRequestT = ObjectT({
    operationalCert: Field(0, ByteStringT),
    intermediateCaCert: Field(1, ByteStringT),
    identityProtectionKey: Field(2, ByteStringT),
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
    InvalidOperationalCert = 0x03,
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

export const CertSigningRequestT = ObjectT({
    certSigningRequest: Field(1, ByteStringT),
    nonce: Field(2, ByteStringT),
    vendorReserved1: OptionalField(3, ByteStringT),
    vendorReserved2: OptionalField(4, ByteStringT),
    vendorReserved3: OptionalField(5, ByteStringT),
});

export const OperationalCredentialsClusterSpec = ClusterSpec(
    0x3e,
    "Operational Credentials",
    {},
    {
        requestAttestation: CommandSpec(0, RequestWithNonceT, 1, AttestationResponseT),
        requestCertChain: CommandSpec(2, CertChainRequestT, 3, CertChainResponseT),
        requestCertSigning: CommandSpec(4, RequestWithNonceT, 5, CertSigningRequestResponseT),
        addOperationalCert: CommandSpec(6, AddNocRequestT, 8, StatusResponseT),
        addRootCert: CommandSpec(11, AddTrustedRootCertificateRequestT, 11, NoResponseT),
    },
)
