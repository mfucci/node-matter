/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../../../crypto/Crypto";
import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import {
    TlvAttestation,
    CertificateChainType,
    OperationalCredentialsCluster,
    OperationalCertStatus,
    TlvCertSigningRequest
} from "../OperationalCredentialsCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { ByteArray } from "@project-chip/matter.js";
import { AttributeServer } from "./AttributeServer";

interface OperationalCredentialsServerConf {
    devicePrivateKey: ByteArray,
    deviceCertificate: ByteArray,
    deviceIntermediateCertificate: ByteArray,
    certificateDeclaration: ByteArray,
}

function signWithDeviceKey(conf: OperationalCredentialsServerConf,session: SecureSession<MatterDevice>, data: ByteArray) {
    return Crypto.sign(conf.devicePrivateKey, [data, session.getAttestationChallengeKey()]);
}

export const OperationalCredentialsClusterHandler: (conf: OperationalCredentialsServerConf) => ClusterServerHandlers<typeof OperationalCredentialsCluster> = (conf) => ({
    requestAttestation: async ({ request: {attestationNonce}, session }) => {
        const elements = TlvAttestation.encode({ declaration: conf.certificateDeclaration, attestationNonce, timestamp: 0 });
        return {elements: elements, signature: signWithDeviceKey(conf, session as SecureSession<MatterDevice>, elements)};
    },

    requestCertSigning: async ({ request: {certSigningRequestNonce}, session }) => {
        const certSigningRequest = session.getContext().getFabricBuilder().createCertificateSigningRequest();
        const elements = TlvCertSigningRequest.encode({ certSigningRequest, certSigningRequestNonce });
        return {elements, signature: signWithDeviceKey(conf, session as SecureSession<MatterDevice>, elements)};
    },

    requestCertChain: async ({ request: {type} }) => {
        switch (type) {
            case CertificateChainType.DeviceAttestation:
                return {certificate: conf.deviceCertificate};
            case CertificateChainType.ProductAttestationIntermediate:
                return {certificate: conf.deviceIntermediateCertificate};
            default:
                throw new Error(`Unsupported certificate type: ${type}`);
        }
    },

    addOperationalCert: async ({ request: {operationalCert, intermediateCaCert, identityProtectionKey, caseAdminNode, adminVendorId}, session, attributes: { fabrics } }) => {
        const device = session.getContext();
        const fabricBuilder = device.getFabricBuilder();
        fabricBuilder.setOperationalCert(operationalCert);
        if (intermediateCaCert && intermediateCaCert.length > 0) fabricBuilder.setIntermediateCACert(intermediateCaCert);
        fabricBuilder.setRootVendorId(adminVendorId);
        fabricBuilder.setIdentityProtectionKey(identityProtectionKey);
        fabricBuilder.setRootNodeId(caseAdminNode);

        const fabric = await fabricBuilder.build();
        device.addFabric(fabric);

        fabrics.set(device.getFabrics().map((fabric, index) => ({
            fabricId: fabric.fabricId,
            label: fabric.label,
            nodeId: fabric.nodeId,
            rootPublicKey: fabric.rootPublicKey,
            vendorId: fabric.rootVendorId,
            fabricIndex: index,
        })));

        // TODO: create ACL with caseAdminNode

        return {status: OperationalCertStatus.Success};
    },

    updateOperationalCert: async ({ request: {operationalCert, intermediateCaCert, }, session}) => {
        throw new Error("Not implemented");
    },

    updateFabricLabel: async ({ request: {label}, attributes: {fabrics}, session }) => {
        if (!session.isSecure()) throw new Error("updateOperationalCert should be called on a secure session.");
        const secureSession = session as SecureSession<MatterDevice>;
        const fabric = secureSession.getFabric();
        if (fabric === undefined) throw new Error("updateOperationalCert on a session linked to a fabric.");

        fabric.label = label;

        fabrics.set(session.getContext().getFabrics().map((fabric, index) => ({
            fabricId: fabric.fabricId,
            label: fabric.label,
            nodeId: fabric.nodeId,
            rootPublicKey: fabric.rootPublicKey,
            vendorId: fabric.rootVendorId,
            fabricIndex: index,
        })));

        return {status: OperationalCertStatus.Success};
    },

    removeFabric: async ({ request: {fabricIndex} }) => {
        throw new Error("Not implemented");
    },

    addRootCert: async ({ request: {certificate}, session} ) => {
        session.getContext().getFabricBuilder().setRootCert(certificate);
    },
});
