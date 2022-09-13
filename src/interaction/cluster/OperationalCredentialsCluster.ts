/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Crypto } from "../../crypto/Crypto";
import { FabricBuilder } from "../../fabric/Fabric";
import { Cluster } from "../model/Cluster";
import { NoResponseT } from "../model/Command";
import { Session } from "../../session/Session";
import { AddNocRequestT, AddTrustedRootCertificateRequestT, AttestationResponseT, AttestationT, CertificateChainRequestT, CertificateChainResponseT, CertificateSigningRequestT, CertificateType, CsrResponseT, RequestWithNonceT, Status, StatusResponseT } from "./OperationalCredentialsMessages";

interface OperationalCredentialsClusterConf {
    devicePrivateKey: Buffer,
    deviceCertificate: Buffer,
    deviceIntermediateCertificate: Buffer,
    certificateDeclaration: Buffer,
}

export class OperationalCredentialsCluster extends Cluster {
    static Builder = (conf: OperationalCredentialsClusterConf) => (endpointId: number) => new OperationalCredentialsCluster(endpointId, conf);

    private fabricBuilder?: FabricBuilder;

    constructor(endpointId: number, private readonly conf: OperationalCredentialsClusterConf) {
        super(
            endpointId,
            0x3e,
            "Operational Credentials",
        );
        
        this.addCommand(0, 1, "AttestationRequest", RequestWithNonceT, AttestationResponseT, ({nonce}, session) => this.handleAttestationRequest(nonce, session));
        this.addCommand(2, 3, "CertificateChainRequest", CertificateChainRequestT, CertificateChainResponseT, ({type}) => this.handleCertificateChainRequest(type));
        this.addCommand(4, 5, "CSRRequest", RequestWithNonceT, CsrResponseT, ({nonce}, session) => this.handleCertificateSignRequest(nonce, session));
        this.addCommand(6, 8, "AddNOC", AddNocRequestT, StatusResponseT, ({nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId}, session) => this.addNewOperationalCertificates(nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId, session));
        this.addCommand(11, 11, "AddTrustedRootCertificate", AddTrustedRootCertificateRequestT, NoResponseT, ({certificate}) => this.addTrustedRootCertificate(certificate));
    }

    private handleAttestationRequest(nonce: Buffer, session: Session) {
        const elements = TlvObjectCodec.encode({ declaration: this.conf.certificateDeclaration, nonce, timestamp: 0 }, AttestationT);
        return {elements: elements, signature: this.signWithDeviceKey(session, elements)};
    }

    private handleCertificateChainRequest(type: CertificateType) {
        switch (type) {
            case CertificateType.DeviceAttestation:
                return {certificate: this.conf.deviceCertificate};
            case CertificateType.ProductAttestationIntermediate:
                return {certificate: this.conf.deviceIntermediateCertificate};
            default:
                throw new Error(`Unsupported certificate type: ${type}`);
        }
    }

    private handleCertificateSignRequest(nonce: Buffer, session: Session) {
        this.fabricBuilder = new FabricBuilder();
        const csr = this.fabricBuilder.createCertificateSigningRequest();
        const elements = TlvObjectCodec.encode({ csr, nonce }, CertificateSigningRequestT);
        return {elements, signature: this.signWithDeviceKey(session, elements)};
    }

    private async addNewOperationalCertificates(nocCert: Buffer, icaCert: Buffer, ipkValue: Buffer, caseAdminNode: bigint, adminVendorId: number, session: Session) {
        if (this.fabricBuilder === undefined) throw new Error("CSRRequest and AddTrustedRootCertificate should be called first!")

        this.fabricBuilder.setNewOpCert(nocCert);
        if (icaCert.length > 0) this.fabricBuilder.setIntermediateCACert(icaCert);
        this.fabricBuilder.setVendorId(adminVendorId);
        this.fabricBuilder.setIdentityProtectionKey(ipkValue);

        const fabric = await this.fabricBuilder.build();
        this.fabricBuilder = undefined;
        session.getServer().getFabricManager().addFabric(fabric);
        session.setFabric(fabric);

        // TODO: create ACL with caseAdminNode

        await session.getServer().setFabric(fabric);

        return {status: Status.Success};
    }

    private addTrustedRootCertificate(certificate: Buffer) {
        if (this.fabricBuilder === undefined) throw new Error("CSRRequest should be called first!")
        this.fabricBuilder.setRootCert(certificate);
    }

    private signWithDeviceKey(session: Session, data: Buffer) {
        return Crypto.sign(this.conf.devicePrivateKey, [data, session.getAttestationChallengeKey()]);
    }
}
