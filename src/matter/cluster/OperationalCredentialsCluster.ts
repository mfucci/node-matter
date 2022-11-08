/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessLevel, Attribute, Cluster, Command, NoResponseT } from "./Cluster";
import { ByteStringT, Field, ObjectT, OptionalField, StringT, ArrayT, BooleanT, EnumT, Bound, UInt8T, UInt32T } from "../../codec/TlvObjectCodec";
import { VendorIdT } from "../common/VendorId";
import { NodeIdT } from "../common/NodeId";
import { SubjectIdT } from "../common/SubjectId";
import { FabricIdT } from "../common/FabricId";
import { FabricIndexT } from "../common/FabricIndex";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.5.1 */
export const RESP_MAX = 900;

/**
 * Encodes a Fabric Reference for a fabric within which a given Node is currently commissioned.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.17.5.3
 */
const FabricDescriptorT = ObjectT({
    /** Contains the public key for the trusted root that scopes the fabric referenced by FabricIndex and its associated operational credential. */
    rootPublicKey: Field(1, ByteStringT({ length: 65 })),
    /** Contains the value of AdminVendorID provided in the AddNOC command that led to the creation of this FabricDescriptorStruct. */
    vendorId: Field(2, VendorIdT),
    /** Contains the FabricID allocated to the fabric referenced by FabricIndex. */
    fabricID: Field(3, FabricIdT),
    /** Contain the NodeID in use within the fabric referenced by FabricIndex. */
    nodeID: Field(4, NodeIdT),
    /** Contains a commissioner-set label for the fabric referenced by FabricIndex. */
    label: Field(5, StringT({ maxLength: 32 })), /* default: "" */
});

/**
 * Encodes a fabric sensitive NOC chain, underpinning a commissioned Operational Identity for a given Node.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.17.5.2
 */
const NocT = ObjectT({
    /** Contains the NOC for the struct’s associated fabric. */
    noc: Field(1, ByteStringT({ maxLength: 400 })),
    /** Contain the ICAC or the struct’s associated fabric. */
    icac: Field(2, ByteStringT({ maxLength: 400 })), /* nullable: true, default(not present): null */
});

/**
 * Used by the CertificateChainRequest command to convey which certificate from the device attestation certificate
 * chain to transmit back to the client.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.17.5.8 */
export const enum CertificateChainType {
    /** Request the DER- encoded DAC certificate */
    DeviceAttestation = 1,
    /** Request the DER- encoded PAI certificate */
    ProductAttestationIntermediate = 2,
}

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.1 */
export const AttestationRequestT = ObjectT({
    /** Contains the attestation nonce to be used in the computation of the Attestation Information. */
    attestationNonce: Field(0, ByteStringT({ length: 32 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.2 */
export const AttestationResponseT = ObjectT({
    /** Contains the octet string of the serialized attestation_elements_message. */
    elements: Field(0, ByteStringT({ maxLength: RESP_MAX })),
    /** Contain the octet string of the necessary attestation_signature. */
    signature: Field(1, ByteStringT({ length: 64 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.5 */
export const CertSigningRequestRequestT = ObjectT({
    /** Contains the CSRNonce to be used in the computation of the NOCSR information. */
    certSigningRequestNonce: Field(0, ByteStringT({ length: 32 })),
    /**
     * If set to true, the internal state of the CSR associated keypair SHALL be tagged as being for
     * a subsequent UpdateNOC, otherwise the internal state of the CSR SHALL be tagged as being for a
     * subsequent AddNOC
     * */
    isForUpdateNOC: OptionalField(1, BooleanT), /* default: false */
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.6 */
export const CertSigningRequestResponseT = ObjectT({
    /** Contains the octet string of the serialized nocsr_elements_message. */
    elements: Field(0, ByteStringT({ maxLength: RESP_MAX })),
    /** Contain the octet string of the necessary attestation_signature. */
    signature: Field(1, ByteStringT({ length: 64 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.3 */
export const CertChainRequestT = ObjectT({
    /** Contains the type of certificate to be requested. */
    type: Field(0, EnumT<CertificateChainType>()),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.4 */
export const CertChainResponseT = ObjectT({
    /** Contains the octet string of the requested certificate. */
    certificate: Field(0, ByteStringT({ maxLength: 600 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.8 */
export const AddNocRequestT = ObjectT({
    /** Contains the Node Operational Certificate (NOC) to be added. */
    operationalCert: Field(0, ByteStringT({ maxLength: 400 })),
    /** Contains the Intermediate CA Certificate (ICAC). */
    intermediateCaCert: OptionalField(1, ByteStringT({ maxLength: 400 })),
    /** Contains the value of the Epoch Key for the Identity Protection Key (IPK) to set for the Fabric which is to be added. */
    identityProtectionKey: Field(2, ByteStringT({ length: 16 })),
    /**
     * Used to atomically add an Access Control Entry enabling that Subject to subsequently administer
     * the Node whose operational identity is being added by this command.
     */
    caseAdminNode: Field(3, SubjectIdT),
    /** Contains the Vendor ID of the entity issuing the AddNOC command. */
    adminVendorId: Field(4, VendorIdT),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.9 */
export const UpdateNocRequestT = ObjectT({
    /** Contains the Node Operational Certificate (NOC). */
    operationalCert: Field(0, ByteStringT({ maxLength: 400 })),
    /** Contains the Intermediate CA Certificate (ICAC). */
    intermediateCaCert: OptionalField(1, ByteStringT({ maxLength: 400 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.13 */
export const AddTrustedRootCertificateRequestT = ObjectT({
    /** Contains the Trusted Root Certificate (TRC) to be added. */
    certificate: Field(0, ByteStringT({ maxLength: 400 })),
});

/**
 * Used by the NOCResponse common response command to convey detailed outcome of several of this cluster’s operations.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.17.5.9 */
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

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.10 */
export const OperationalCertificateStatusResponseT = ObjectT({
    /** Contains a NOCStatus value representing the status of an operation involving a NOC. */
    status: Field(0, EnumT<OperationalCertStatus>()),
    /** When action was successful, contains the Fabric Index of the Fabric last added, removed or updated. */
    fabricIndex: OptionalField(1, FabricIndexT),
    /** Optionally contains debugging textual information from the cluster implementation and should be visible in logs, not User UI */
    debugText: OptionalField(2, StringT({ maxLength: 128 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.5.4 */
export const AttestationT = ObjectT({
    declaration: Field(1, ByteStringT()),
    attestationNonce: Field(2, ByteStringT({ length: 32 })),
    timestamp: Field(3, UInt32T), // TODO: check actual max length in specs
    firmwareInfo: OptionalField(4, ByteStringT()),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.5.6 */
export const CertSigningRequestT = ObjectT({
    certSigningRequest: Field(1, ByteStringT()),
    certSigningRequestNonce: Field(2, ByteStringT({ length: 32})),
    vendorReserved1: OptionalField(3, ByteStringT()),
    vendorReserved2: OptionalField(4, ByteStringT()),
    vendorReserved3: OptionalField(5, ByteStringT()),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.11 */
export const UpdateFabricLabelRequestT = ObjectT({
    /** Contains the label to set for the fabric associated with the current secure session. */
    label: Field(0, StringT({ maxLength: 32 })),
});

/** @see {@link MatterCoreSpecificationV1_0} § 11.17.7.12 */
export const RemoveFabricRequestT = ObjectT({
    /** Contains the Fabric Index reference associated with the Fabric which is to be removed from the device. */
    fabricIndex: Field(0, FabricIndexT),
});

/**
 * This cluster is used to add or remove Operational Credentials on a Commissionee or Node, as well as manage the
 * associated Fabrics.
 *
 * clusterRevision: 1
 *
 * @see {@link MatterCoreSpecificationV1_0} § 11.17
 */
export const OperationalCredentialsCluster = Cluster({
    id: 0x3e,
    name: "Operational Credentials",
    revision: 1,

    /** @see {@link MatterCoreSpecificationV1_0} § 11.17.6 */
    attributes: {
        /** Contains all NOCs applicable to this Node. */
        nocs: Attribute(0, ArrayT(NocT), { readAcl: AccessLevel.Administer}), //??
        /** Describes all fabrics to which this Node is commissioned. */
        fabrics: Attribute(1, ArrayT(FabricDescriptorT)),
        /** Contains the number of Fabrics that are supported by the device. */
        supportedFabrics: Attribute(2, Bound(UInt8T, { min: 5, max: 254 })),
        /** Contains the number of Fabrics to which the device is currently commissioned. */
        commissionedFabrics: Attribute(3, UInt8T),
        /** Contains a read-only list of Trusted Root CA Certificates installed on the Node. */
        trustedRootCertificates: Attribute(4, ArrayT(ByteStringT(), { maxLength: 400 })),
        /** Contain accessing fabric index. */
        currentFabricIndex: Attribute(5, UInt8T),
    },
    /** @see {@link MatterCoreSpecificationV1_0} § 11.17.7 */
    commands: {
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
});
