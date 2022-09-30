/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { Crypto } from "../../../crypto/Crypto";
import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { AttestationT, CertificateType, CertSigningRequestT, OperationalCredentialsClusterSpec, Status } from "../OperationalCredentialsCluster";
import { ClusterServerHandlers } from "./ClusterServer";

interface OperationalCredentialsServerConf {
    devicePrivateKey: Buffer,
    deviceCertificate: Buffer,
    deviceIntermediateCertificate: Buffer,
    certificateDeclaration: Buffer,
}

function signWithDeviceKey(conf: OperationalCredentialsServerConf,session: Session<MatterDevice>, data: Buffer) {
    return Crypto.sign(conf.devicePrivateKey, [data, session.getAttestationChallengeKey()]);
}

export const OperationalCredentialsClusterHandler: (conf: OperationalCredentialsServerConf) => ClusterServerHandlers<typeof OperationalCredentialsClusterSpec> = (conf) => ({
    requestAttestation: async ({ request: {nonce}, session }) => {
        const elements = TlvObjectCodec.encode({ declaration: conf.certificateDeclaration, nonce, timestamp: 0 }, AttestationT);
        return {elements: elements, signature: signWithDeviceKey(conf, session, elements)};
    },

    requestCertSigning: async ({ request: {nonce}, session }) => {
        const certSigningRequest = session.getContext().getFabricBuilder().createCertificateSigningRequest();
        const elements = TlvObjectCodec.encode({ certSigningRequest, nonce }, CertSigningRequestT);
        return {elements, signature: signWithDeviceKey(conf, session, elements)};
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

    addOperationalCert: async ({ request: {operationalCert, intermediateCaCert, identityProtectionKey, caseAdminNode, adminVendorId}, session}) => {
        const fabricBuilder = session.getContext().getFabricBuilder();
        fabricBuilder.setOperationalCert(operationalCert);
        if (intermediateCaCert.length > 0) fabricBuilder.setIntermediateCACert(intermediateCaCert);
        fabricBuilder.setVendorId(adminVendorId);
        fabricBuilder.setIdentityProtectionKey(identityProtectionKey);

        const fabric = await fabricBuilder.build();
        session.getContext().setFabric(fabric);
        session.setFabric(fabric);

        // TODO: create ACL with caseAdminNode

        return {status: Status.Success};
    },

    addRootCert: async ({ request: {certificate}, session} ) => {
        session.getContext().getFabricBuilder().setRootCert(certificate);
    },
});
