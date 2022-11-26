/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvVendorId } from "../common/VendorId";
import { TlvNodeId } from "../common/NodeId";
import { TlvSubjectId } from "../common/SubjectId";
import { TlvFabricId } from "../common/FabricId";
import { TlvFabricIndex } from "../common/FabricIndex";
import { AccessLevel, Attribute, Cluster, Command, TlvNoResponse } from "./Cluster";
import { tlv, spec } from "@project-chip/matter.js";

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.1 */
export const RESP_MAX = 900;

/**
 * Encodes a Fabric Reference for a fabric within which a given Node is currently commissioned.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.3
 */
const TlvFabricDescriptor = tlv.Object({
    /** Contains the public key for the trusted root that scopes the fabric referenced by FabricIndex and its associated operational credential. */
    rootPublicKey: tlv.Field(1, tlv.ByteString.bound({ length: 65 })),

    /** Contains the value of AdminVendorID provided in the AddNOC command that led to the creation of this FabricDescriptorStruct. */
    vendorId: tlv.Field(2, TlvVendorId),

    /** Contains the FabricID allocated to the fabric referenced by FabricIndex. */
    fabricID: tlv.Field(3, TlvFabricId),

    /** Contain the NodeID in use within the fabric referenced by FabricIndex. */
    nodeID: tlv.Field(4, TlvNodeId),

    /** Contains a commissioner-set label for the fabric referenced by FabricIndex. */
    label: tlv.Field(5, tlv.String.bound({ maxLength: 32 })), /* default: "" */
});

/**
 * Encodes a fabric sensitive NOC chain, underpinning a commissioned Operational Identity for a given Node.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.2
 */
const TlvNoc = tlv.Object({
    /** Contains the NOC for the struct’s associated fabric. */
    noc: tlv.Field(1, tlv.ByteString.bound({ maxLength: 400 })),

    /** Contain the ICAC or the struct’s associated fabric. */
    icac: tlv.Field(2, tlv.Nullable(tlv.ByteString.bound({ maxLength: 400 }))), /* default(not present): null */
});

/**
 * Used by the CertificateChainRequest command to convey which certificate from the device attestation certificate
 * chain to transmit back to the client.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.8 */
export const enum CertificateChainType {
    /** Request the DER- encoded DAC certificate */
    DeviceAttestation = 1,

    /** Request the DER- encoded PAI certificate */
    ProductAttestationIntermediate = 2,
}

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.1 */
const TlvAttestationRequest = tlv.Object({
    /** Contains the attestation nonce to be used in the computation of the Attestation Information. */
    attestationNonce: tlv.Field(0, tlv.ByteString.bound({ length: 32 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.2 */
const TlvAttestationResponse = tlv.Object({
    /** Contains the octet string of the serialized attestation_elements_message. */
    elements: tlv.Field(0, tlv.ByteString.bound({ maxLength: RESP_MAX })),

    /** Contain the octet string of the necessary attestation_signature. */
    signature: tlv.Field(1, tlv.ByteString.bound({ length: 64 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.5 */
const TlvCertSigningRequestRequest = tlv.Object({
    /** Contains the CSRNonce to be used in the computation of the NOCSR information. */
    certSigningRequestNonce: tlv.Field(0, tlv.ByteString.bound({ length: 32 })),

    /**
     * If set to true, the internal state of the CSR associated keypair SHALL be tagged as being for
     * a subsequent UpdateNOC, otherwise the internal state of the CSR SHALL be tagged as being for a
     * subsequent AddNOC
     * */
    isForUpdateNOC: tlv.OptionalField(1,  tlv.Boolean), /* default: false */
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.6 */
const TlvCertSigningRequestResponse = tlv.Object({
    /** Contains the octet string of the serialized nocsr_elements_message. */
    elements: tlv.Field(0, tlv.ByteString.bound({ maxLength: RESP_MAX })),

    /** Contain the octet string of the necessary attestation_signature. */
    signature: tlv.Field(1, tlv.ByteString.bound({ length: 64 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.3 */
const TlvCertChainRequest = tlv.Object({
    /** Contains the type of certificate to be requested. */
    type: tlv.Field(0, tlv.Enum<CertificateChainType>()),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.4 */
const TlvCertChainResponse = tlv.Object({
    /** Contains the octet string of the requested certificate. */
    certificate: tlv.Field(0, tlv.ByteString.bound({ maxLength: 600 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.8 */
const TlvAddNocRequest = tlv.Object({
    /** Contains the Node Operational Certificate (NOC) to be added. */
    operationalCert: tlv.Field(0, tlv.ByteString.bound({ maxLength: 400 })),

    /** Contains the Intermediate CA Certificate (ICAC). */
    intermediateCaCert: tlv.OptionalField(1, tlv.ByteString.bound({ maxLength: 400 })),

    /** Contains the value of the Epoch Key for the Identity Protection Key (IPK) to set for the Fabric which is to be added. */
    identityProtectionKey: tlv.Field(2, tlv.ByteString.bound({ length: 16 })),

    /**
     * Used to atomically add an Access Control Entry enabling that Subject to subsequently administer
     * the Node whose operational identity is being added by this command.
     */
    caseAdminNode: tlv.Field(3, TlvSubjectId),

    /** Contains the Vendor ID of the entity issuing the AddNOC command. */
    adminVendorId: tlv.Field(4, TlvVendorId),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.9 */
const TlvUpdateNocRequest = tlv.Object({
    /** Contains the Node Operational Certificate (NOC). */
    operationalCert: tlv.Field(0, tlv.ByteString.bound({ maxLength: 400 })),

    /** Contains the Intermediate CA Certificate (ICAC). */
    intermediateCaCert: tlv.OptionalField(1, tlv.ByteString.bound({ maxLength: 400 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.13 */
const TlvAddTrustedRootCertificateRequest = tlv.Object({
    /** Contains the Trusted Root Certificate (TRC) to be added. */
    certificate: tlv.Field(0, tlv.ByteString.bound({ maxLength: 400 })),
});

/**
 * Used by the NOCResponse common response command to convey detailed outcome of several of this cluster’s operations.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.9 */
export const enum OperationalCertStatus {
    /** OK, no error. */
    Success = 0x00,

    /** Public Key in the NOC does not match the public key in the NOCSR. */
    InvalidPublicKey = 0x01,

    /** The Node Operational ID in the NOC is not formatted correctly. */
    InvalidNodeOpId = 0x02,

    /** Any other validation error in NOC chain. */
    InvalidOperationalCert = 0x03,

    /** No record of prior CSR for which this NOC could match. */
    MissingCsr = 0x04,

    /** NOCs table full, cannot add another one. */
    TableFull = 0x05,

    /** Invalid CaseAdminSubject field for an AddNOC command. */
    InvalidAdminSubject = 0x06,

    /** Trying to AddNOC instead of UpdateNOC against an existing Fabric. */
    FabricConflict = 0x09,

    /** Label already exists on another Fabric. */
    LabelConflict = 0x0a,

    /** FabricIndex argument is invalid. */
    InvalidFabricIndex = 0x0b,
}

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.10 */
const TlvOperationalCertificateStatusResponse = tlv.Object({
    /** Contains a NOCStatus value representing the status of an operation involving a NOC. */
    status: tlv.Field(0, tlv.Enum<OperationalCertStatus>()),

    /** When action was successful, contains the Fabric Index of the Fabric last added, removed or updated. */
    fabricIndex: tlv.OptionalField(1, TlvFabricIndex),

    /** Optionally contains debugging textual information from the cluster implementation and should be visible in logs, not User UI */
    debugText: tlv.OptionalField(2, tlv.String.bound({ maxLength: 128 })),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.4 */
export const TlvAttestation = tlv.Object({
    declaration: tlv.Field(1, tlv.ByteString),
    attestationNonce: tlv.Field(2, tlv.ByteString.bound({ length: 32 })),
    timestamp: tlv.Field(3, tlv.UInt32), // TODO: check actual max length in specs
    firmwareInfo: tlv.OptionalField(4, tlv.ByteString),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.5.6 */
export const TlvCertSigningRequest = tlv.Object({
    certSigningRequest: tlv.Field(1, tlv.ByteString),
    certSigningRequestNonce: tlv.Field(2, tlv.ByteString.bound({ length: 32})),
    vendorReserved1: tlv.OptionalField(3, tlv.ByteString),
    vendorReserved2: tlv.OptionalField(4, tlv.ByteString),
    vendorReserved3: tlv.OptionalField(5, tlv.ByteString),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.11 */
const TlvUpdateFabricLabelRequest = tlv.Object({
    /** Contains the label to set for the fabric associated with the current secure session. */
    label: tlv.Field(0, tlv.String32max),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7.12 */
const TlvRemoveFabricRequest = tlv.Object({
    /** Contains the Fabric Index reference associated with the Fabric which is to be removed from the device. */
    fabricIndex: tlv.Field(0, TlvFabricIndex),
});

/**
 * This cluster is used to add or remove Operational Credentials on a Commissionee or Node, as well as manage the
 * associated Fabrics.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.17
 */
export const OperationalCredentialsCluster = Cluster({
    id: 0x3e,
    name: "Operational Credentials",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.6 */
    attributes: {
        /** Contains all NOCs applicable to this Node. */
        nocs: Attribute(0, tlv.Array(TlvNoc), { readAcl: AccessLevel.Administer }),

        /** Describes all fabrics to which this Node is commissioned. */
        fabrics: Attribute(1, tlv.Array(TlvFabricDescriptor)),

        /** Contains the number of Fabrics that are supported by the device. */
        supportedFabrics: Attribute(2, tlv.UInt8.bound({ min: 5, max: 254 })),

        /** Contains the number of Fabrics to which the device is currently commissioned. */
        commissionedFabrics: Attribute(3, tlv.UInt8),

        /** Contains a read-only list of Trusted Root CA Certificates installed on the Node. */
        trustedRootCertificates: Attribute(4, tlv.Array(tlv.ByteString, { maxLength: 400 })),

        /** Contain accessing fabric index. */
        currentFabricIndex: Attribute(5, tlv.UInt8),
    },
    /** @see {@link spec.MatterCoreSpecificationV1_0} § 11.17.7 */
    commands: {
        /** Sender is requesting attestation information from the receiver. */
        requestAttestation: Command(0, TlvAttestationRequest, 1, TlvAttestationResponse),

        /** Sender is requesting a device attestation certificate from the receiver. */
        requestCertChain: Command(2, TlvCertChainRequest, 3, TlvCertChainResponse),

        /** Sender is requesting a certificate signing request (CSR) from the receiver. */
        requestCertSigning: Command(4, TlvCertSigningRequestRequest, 5, TlvCertSigningRequestResponse),

        /** Sender is requesting to add the new node operational certificates. */
        addOperationalCert: Command(6, TlvAddNocRequest, 8, TlvOperationalCertificateStatusResponse),

        /** Sender is requesting to update the node operational certificates. */
        updateOperationalCert: Command(7, TlvUpdateNocRequest, 8, TlvOperationalCertificateStatusResponse),

        /**
         * This command SHALL be used by an Administrative Node to set the user-visible Label field for a given
         * Fabric, as reflected by entries in the Fabrics attribute.
         */
        updateFabricLabel: Command(9, TlvUpdateFabricLabelRequest, 8, TlvOperationalCertificateStatusResponse),

        /**
         * This command is used by Administrative Nodes to remove a given fabric index and delete all associated
         * fabric-scoped data.
         */
        removeFabric: Command(10, TlvRemoveFabricRequest, 8, TlvOperationalCertificateStatusResponse),

        /**
         * This command SHALL add a Trusted Root CA Certificate, provided as its CHIP Certificate representation.
         */
        addRootCert: Command(11, TlvAddTrustedRootCertificateRequest, 11, TlvNoResponse),
    },
});
