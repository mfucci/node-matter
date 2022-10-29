/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, Cluster, Command, NoResponseT } from "./Cluster";
import { ByteStringT, Field, ObjectT, OptionalField, UnsignedIntT, UnsignedLongT, StringT, ArrayT, BooleanT, EnumT, BoundedUnsignedIntT } from "../../codec/TlvObjectCodec";

const FabricDescriptorT = ObjectT({
    rootPublicKey: Field(1, ByteStringT), /* length: 65 */
    vendorId: Field(2, UnsignedIntT), /* type: vendor-id */
    fabricID: Field(3, UnsignedIntT), /* type: fabric-id */
    nodeID: Field(4, UnsignedIntT), /* type: node-id */
    label: Field(5, StringT({ maxLength: 32 })), /* default: "" */
});

const NocT = ObjectT({
    noc: Field(1, ByteStringT), /* maxLength: 400 */
    icac: Field(2, ByteStringT), /* maxLength: 400, default(not present): null */
});

export const enum CertificateType {
    DeviceAttestation = 1,
    ProductAttestationIntermediate = 2,
}

export const AttestationRequestT = ObjectT({
    attestationNonce: Field(0, ByteStringT), /* length: 32 */
});

export const AttestationResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT), /* length: 64 */
});

export const CertSigningRequestRequestT = ObjectT({
    certSigningRequestNonce: Field(0, ByteStringT), /* length: 32 */
    isForUpdateNOC: OptionalField(1, BooleanT), /* default: false */
});

export const CertSigningRequestResponseT = ObjectT({
    elements: Field(0, ByteStringT),
    signature: Field(1, ByteStringT), /* length: 64 */
});

export const CertChainRequestT = ObjectT({
    type: Field(0, EnumT<CertificateType>()),
});

export const CertChainResponseT = ObjectT({
    certificate: Field(0, ByteStringT), /* maxLength: 600 */
});

export const AddNocRequestT = ObjectT({
    operationalCert: Field(0, ByteStringT), /* maxLength: 400 */
    intermediateCaCert: OptionalField(1, ByteStringT), /* maxLength: 400 */
    identityProtectionKey: Field(2, ByteStringT), /* length: 16 */
    caseAdminNode: Field(3, UnsignedLongT), /* type: subject-id */
    adminVendorId: Field(4, UnsignedIntT), /* type: vendor-id */
});

export const UpdateNocRequestT = ObjectT({
    operationalCert: Field(0, ByteStringT), /* maxLength: 400 */
    intermediateCaCert: OptionalField(1, ByteStringT), /* maxLength: 400 */
});

export const AddTrustedRootCertificateRequestT = ObjectT({
    certificate: Field(0, ByteStringT), /* maxLength: 400 */
});

export const enum OperationalCertStatus {
    Success = 0x00,
    InvalidPublicKey = 0x01,
    InvalidNodeOpId = 0x02,
    InvalidOperationalCert = 0x03,
    MissingCsr = 0x04,
    TableFull = 0x05,
    InvalidAdminSubject = 0x06,
    FabricConflict = 0x09,
    LabelConflict = 0x0a,
    InvalidFabricIndex = 0x0b,
}

export const OperationalCertificateStatusResponseT = ObjectT({
    status: Field(0, EnumT<OperationalCertStatus>()),
    fabricIndex: OptionalField(1, BoundedUnsignedIntT({ min: 1, max: 254 })), /* type: fabric_idx */
    debugText: OptionalField(2, StringT({ maxLength: 128 })),
});

export const AttestationT = ObjectT({
    declaration: Field(1, ByteStringT),
    attestationNonce: Field(2, ByteStringT),
    timestamp: Field(3, UnsignedIntT),
    firmwareInfo: OptionalField(4, ByteStringT),
});

export const CertSigningRequestT = ObjectT({
    certSigningRequest: Field(1, ByteStringT),
    certSigningRequestNonce: Field(2, ByteStringT),
    vendorReserved1: OptionalField(3, ByteStringT),
    vendorReserved2: OptionalField(4, ByteStringT),
    vendorReserved3: OptionalField(5, ByteStringT),
});

export const UpdateFabricLabelRequestT = ObjectT({
    fabricIndex: Field(0, UnsignedIntT), /* type: fabric_idx */
});

export const RemoveFabricRequestT = ObjectT({
    fabricIndex: Field(0, UnsignedIntT), /* type: fabric_idx */
});

/**
 * This cluster is used to add or remove Operational Credentials on a Commissionee or Node, as well as manage the
 * associated Fabrics.
 */
export const OperationalCredentialsCluster = Cluster(
    0x3e,
    "Operational Credentials",
    {
        nocs: Attribute(0, ArrayT(NocT)),
        fabrics: Attribute(1, ArrayT(FabricDescriptorT)),
        supportedFabrics: Attribute(2, BoundedUnsignedIntT({ min: 5, max: 254 })),
        commissionedFabrics: Attribute(3, UnsignedIntT),
        trustedRootCertificates: Attribute(4, ArrayT(ByteStringT)), /* arrayMaxLength: 400 */
        currentFabricIndex: Attribute(5, UnsignedIntT),
    },
    {
        /** Sender is requesting attestation information from the receiver. */
        requestAttestation: Command(0, AttestationRequestT, 1, AttestationResponseT),

        /** Sender is requesting a device attestation certificate from the receiver. */
        requestCertChain: Command(2, CertChainRequestT, 3, CertChainResponseT),

        /** Sender is requesting a certificate signing request (CSR) from the receiver. */
        requestCertSigning: Command(4, CertSigningRequestRequestT, 5, CertSigningRequestResponseT),

        /** Sender is requesting to add the new node operational certificates. */
        addOperationalCert: Command(6, AddNocRequestT, 8, OperationalCertificateStatusResponseT),

        /** Sender is requesting to update the node operational certificates. */
        updateOperationalCert: Command(7, UpdateNocRequestT, 8, OperationalCertificateStatusResponseT),

        /**
         * This command SHALL be used by an Administrative Node to set the user-visible Label field for a given
         * Fabric, as reflected by entries in the Fabrics attribute.
         */
        updateFabricLabel: Command(9, UpdateFabricLabelRequestT, 8, OperationalCertificateStatusResponseT),

        /**
         * This command is used by Administrative Nodes to remove a given fabric index and delete all associated
         * fabric-scoped data.
         */
        removeFabric: Command(10, RemoveFabricRequestT, 8, OperationalCertificateStatusResponseT),

        /**
         * This command SHALL add a Trusted Root CA Certificate, provided as its CHIP Certificate representation.
         */
        addRootCert: Command(11, AddTrustedRootCertificateRequestT, 11, NoResponseT),
    },
)
