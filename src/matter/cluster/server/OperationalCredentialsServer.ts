/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { Crypto } from "../../../crypto/Crypto";
import { NodeId } from "../../common/NodeId";
import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import {
    AttestationT,
    CertificateType,
    CertSigningRequestT,
    OperationalCredentialsCluster,
    OperationalCertStatus
} from "../OperationalCredentialsCluster";
import { ClusterServerHandlers } from "./ClusterServer";

interface OperationalCredentialsServerConf {
    devicePrivateKey: Buffer,
    deviceCertificate: Buffer,
    deviceIntermediateCertificate: Buffer,
    certificateDeclaration: Buffer,
}

function signWithDeviceKey(conf: OperationalCredentialsServerConf,session: SecureSession<MatterDevice>, data: Buffer) {
    return Crypto.sign(conf.devicePrivateKey, [data, session.getAttestationChallengeKey()]);
}

export const OperationalCredentialsClusterHandler: (conf: OperationalCredentialsServerConf) => ClusterServerHandlers<typeof OperationalCredentialsCluster> = (conf) => ({
    requestAttestation: async ({ request: {attestationNonce}, session }) => {
        const elements = TlvObjectCodec.encode({ declaration: conf.certificateDeclaration, attestationNonce, timestamp: 0 }, AttestationT);
        return {elements: elements, signature: signWithDeviceKey(conf, session as SecureSession<MatterDevice>, elements)};
    },

    requestCertSigning: async ({ request: {certSigningRequestNonce}, session }) => {
        const certSigningRequest = session.getContext().getFabricBuilder().createCertificateSigningRequest();
        const elements = TlvObjectCodec.encode({ certSigningRequest, certSigningRequestNonce }, CertSigningRequestT);
        return {elements, signature: signWithDeviceKey(conf, session as SecureSession<MatterDevice>, elements)};
    },

    requestCertChain: async ({ request: {type} }) => {
        switch (type) {
            case CertificateType.DeviceAttestation:
                return {certificate: conf.deviceCertificate};
            case CertificateType.ProductAttestationIntermediate:
                return {certificate: conf.deviceIntermediateCertificate};
            default:
                throw new Error(`Unsupported certificate type: ${type}`);
        }
    },

    addOperationalCert: async ({ request: {operationalCert, intermediateCaCert, identityProtectionKey, caseAdminNode, adminVendorId}, session, attributes: { fabrics }}) => {
        const fabricBuilder = session.getContext().getFabricBuilder();
        fabricBuilder.setOperationalCert(operationalCert);
        if (intermediateCaCert && intermediateCaCert.length > 0) fabricBuilder.setIntermediateCACert(intermediateCaCert);
        fabricBuilder.setRootVendorId(adminVendorId);
        fabricBuilder.setRootNodeId(session.getPeerNodeId() as NodeId);
        fabricBuilder.setIdentityProtectionKey(identityProtectionKey);

        const fabric = await fabricBuilder.build();
        session.getContext().setFabric(fabric);

        // TODO: create ACL with caseAdminNode

        fabrics.set([{
            fabricId: fabric.id,
            label: "",
            nodeId: fabric.nodeId,
            rootPublicKey: fabric.rootPublicKey,
            vendorId: fabric.rootVendorId,
            fabricIndex: 1,
        }]);

        return {status: OperationalCertStatus.Success};
    },

    updateOperationalCert: async ({ request: {operationalCert, intermediateCaCert, }, session}) => {
        throw new Error("Not implemented");

        return {status: OperationalCertStatus.Success};
    },

    updateFabricLabel: async ({ request: {label} }) => {
        throw new Error("Not implemented");

        return {status: OperationalCertStatus.Success};
    },

    removeFabric: async ({ request: {fabricIndex} }) => {
        throw new Error("Not implemented");

        return {status: OperationalCertStatus.Success};
    },

    addRootCert: async ({ request: {certificate}, session} ) => {
        session.getContext().getFabricBuilder().setRootCert(certificate);
    },
});
