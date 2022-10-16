/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { SECURE_CHANNEL_PROTOCOL_ID } from "./session/secure/SecureChannelMessages";
import { ResumptionRecord, SessionManager } from "./session/SessionManager";
import { NetInterface } from "../net/NetInterface";
import { ExchangeManager, MessageChannel } from "./common/ExchangeManager";
import { PaseClient } from "./session/secure/PaseClient";
import { ClusterClient, InteractionClient } from "./interaction/InteractionClient";
import { INTERACTION_PROTOCOL_ID } from "./interaction/InteractionServer";
import { BasicCluster } from "./cluster/BasicCluster";
import { CommissioningError, GeneralCommissioningCluster, RegulatoryLocationType, SuccessFailureReponse } from "./cluster/GeneralCommissioningCluster";
import { CertificateType, CertSigningRequestT, OperationalCredentialsCluster } from "./cluster/OperationalCredentialsCluster";
import { Crypto } from "../crypto/Crypto";
import { CertificateManager, jsToMatterDate, OperationalCertificateT, RootCertificateT } from "./certificate/CertificateManager";
import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Scanner } from "./common/Scanner";
import { Fabric, FabricBuilder } from "./fabric/Fabric";
import { CaseClient } from "./session/secure/CaseClient";
import { requireMinNodeVersion } from "../util/Node";
import { ChannelManager } from "./common/ChannelManager";

requireMinNodeVersion(16);

const FABRIC_ID = BigInt(1);
const CONTROLLER_NODE_ID = BigInt(0);
const ADMIN_VENDOR_ID = 752;

export class MatterController {
    public static async create(scanner: Scanner, netInterface: NetInterface) {
        const certificateManager = new RootCertificateManager();
        const ipkValue = Crypto.getRandomData(16);
        const fabricBuilder = new FabricBuilder()
            .setRootCert(certificateManager.getRootCert())
            .setIdentityProtectionKey(ipkValue)
            .setVendorId(ADMIN_VENDOR_ID);
        fabricBuilder.setOperationalCert(certificateManager.generateNoc(fabricBuilder.getPublicKey(), FABRIC_ID, CONTROLLER_NODE_ID));
        const fabric = await fabricBuilder.build();
        return new MatterController(scanner, netInterface, certificateManager, fabric);
    }

    private readonly sessionManager = new SessionManager(this);
    private readonly channelManager = new ChannelManager();
    private readonly exchangeManager = new ExchangeManager<MatterController>(this.sessionManager, this.channelManager);
    private readonly paseClient = new PaseClient();
    private readonly caseClient = new CaseClient();

    constructor(
        private readonly scanner: Scanner,
        private readonly netInterface: NetInterface,
        private readonly certificateManager: RootCertificateManager,
        private readonly fabric: Fabric,
    ) {
        this.exchangeManager.addNetInterface(netInterface);
    }

    async commission(commissionAddress: string, commissionPort: number, discriminator: number, setupPin: number) {
        const paseChannel = await this.netInterface.openChannel(commissionAddress, commissionPort);

        // Do PASE paring
        const paseUnsecureMessageChannel = new MessageChannel(paseChannel, this.sessionManager.getUnsecureSession());
        const paseSecureSession = await this.paseClient.pair(this, this.exchangeManager.initiateExchangeWithChannel(paseUnsecureMessageChannel, SECURE_CHANNEL_PROTOCOL_ID), setupPin);

        // Use the created secure session to do the commissioning
        const paseSecureMessageChannel = new MessageChannel(paseChannel, paseSecureSession);
        let interactionClient = new InteractionClient(() => this.exchangeManager.initiateExchangeWithChannel(paseSecureMessageChannel, INTERACTION_PROTOCOL_ID));
        
        // Get and display the product name (just for debugging)
        const basicClusterClient = ClusterClient(interactionClient, 0, BasicCluster);
        const productName = await basicClusterClient.getProductName();
        console.log(`Paired with device: ${productName}`);

        // Do the commissioning
        let generalCommissioningClusterClient = ClusterClient(interactionClient, 0, GeneralCommissioningCluster);
        this.ensureSuccess(await generalCommissioningClusterClient.armFailSafe({ breadcrumbStep: 1, expiryLengthSeconds: 60 }));
        this.ensureSuccess(await generalCommissioningClusterClient.updateRegulatoryConfig({ breadcrumbStep: 2, config: RegulatoryLocationType.IndoorOutdoor, countryCode: "US"}));

        const operationalCredentialsClusterClient = ClusterClient(interactionClient, 0, OperationalCredentialsCluster);
        const { certificate: deviceAttestation } = await operationalCredentialsClusterClient.requestCertChain({ type: CertificateType.DeviceAttestation });
        // TODO: extract device public key from deviceAttestation
        const { certificate: productAttestation } = await operationalCredentialsClusterClient.requestCertChain({ type: CertificateType.ProductAttestationIntermediate });
        // TODO: validate deviceAttestation and productAttestation
        const { elements: attestationElements, signature: attestationSignature } = await operationalCredentialsClusterClient.requestAttestation({ nonce: Crypto.getRandomData(16) });
        // TODO: validate attestationSignature using device public key 
        const { elements: csrElements, signature: csrSignature } = await operationalCredentialsClusterClient.requestCertSigning({ nonce: Crypto.getRandomData(16) });
        // TOTO: validate csrSignature using device public key
        const { certSigningRequest } = TlvObjectCodec.decode(csrElements, CertSigningRequestT);
        const operationalPublicKey = CertificateManager.getPublicKeyFromCsr(certSigningRequest);
        
        await operationalCredentialsClusterClient.addRootCert({ certificate: this.certificateManager.getRootCert() });
        const peerNodeId = BigInt(1);
        const peerOperationalCert = this.certificateManager.generateNoc(operationalPublicKey, FABRIC_ID, peerNodeId);
        await operationalCredentialsClusterClient.addOperationalCert({
            operationalCert: peerOperationalCert,
            intermediateCaCert: Buffer.alloc(0),
            identityProtectionKey: this.fabric.identityProtectionKey,
            adminVendorId: ADMIN_VENDOR_ID,
            caseAdminNode: CONTROLLER_NODE_ID,
        });

        // Look for the device broadcast over MDNS
        const scanResult = await this.scanner.findDevice(this.fabric, peerNodeId);
        if (scanResult === undefined) throw new Error("The device being commissioned cannot be found on the network");
        const { ip: operationalIp, port: operationalPort } = scanResult;

        // Do CASE pairing
        const operationalChannel = await this.netInterface.openChannel(operationalIp, operationalPort);
        const operationalUnsecureMessageExchange = new MessageChannel(operationalChannel, this.sessionManager.getUnsecureSession());
        const operationalSecureSession = await this.caseClient.pair(this, this.exchangeManager.initiateExchangeWithChannel(operationalUnsecureMessageExchange, SECURE_CHANNEL_PROTOCOL_ID), this.fabric, peerNodeId);
        this.channelManager.setChannel(this.fabric, peerNodeId, new MessageChannel(operationalChannel, operationalSecureSession));
        interactionClient = new InteractionClient(() => this.exchangeManager.initiateExchange(this.fabric, peerNodeId, INTERACTION_PROTOCOL_ID));

        // Complete the commission
        generalCommissioningClusterClient = ClusterClient(interactionClient, 0, GeneralCommissioningCluster);
        this.ensureSuccess(await generalCommissioningClusterClient.commissioningComplete({}));
    }

    async connect(nodeId: bigint) {
        return new InteractionClient(() => this.exchangeManager.initiateExchange(this.fabric, nodeId, INTERACTION_PROTOCOL_ID));
    }

    private ensureSuccess({ errorCode, debugText }: SuccessFailureReponse) {
        if (errorCode === CommissioningError.Ok) return;
        throw new Error(`Commission error: ${errorCode}, ${debugText}`);
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, fabric: Fabric | undefined,  peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, isResumption: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, fabric, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, isResumption, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }

    getResumptionRecord(resumptionId: Buffer) {
        return this.sessionManager.findResumptionRecordById(resumptionId);
    }

    findResumptionRecordByNodeId(nodeId: bigint) {
        return this.sessionManager.findResumptionRecordByNodeId(nodeId);
    }

    saveResumptionRecord(resumptionRecord: ResumptionRecord) {
        return this.sessionManager.saveResumptionRecord(resumptionRecord);
    }

    close() {
        this.scanner.close();
        this.exchangeManager.close();
    }
}

class RootCertificateManager {
    private readonly rootCertId = 0;
    private readonly rootKeyPair = Crypto.createKeyPair();
    private readonly rootKeyIdentifier = Crypto.hash(this.rootKeyPair.publicKey);
    private readonly rootCertBytes = this.generateRootCert();
    private nextCertificateId = 1;

    getRootCert() {
        return this.rootCertBytes;
    }

    private generateRootCert(): Buffer {
        const unsignedCertificate = {
            serialNumber: Buffer.alloc(1, this.rootCertId),
            signatureAlgorithm: 1 /* EcdsaWithSHA256 */ ,
            publicKeyAlgorithm: 1 /* EC */,
            ellipticCurveIdentifier: 1 /* P256v1 */,
            issuer: { },
            notBefore: jsToMatterDate(new Date(), -1),
            notAfter: jsToMatterDate(new Date(), 10),
            subject: { rcacId: this.rootCertId },
            ellipticCurvePublicKey: this.rootKeyPair.publicKey,
            extensions: {
                basicConstraints: { isCa: true },
                keyUsage: 96,
                subjectKeyIdentifier: this.rootKeyIdentifier,
                authorityKeyIdentifier: this.rootKeyIdentifier,
            },
        };
        const signature = Crypto.sign(this.rootKeyPair.privateKey, CertificateManager.rootCertToAsn1(unsignedCertificate));
        return TlvObjectCodec.encode({ ...unsignedCertificate, signature }, RootCertificateT);
    }
    
    generateNoc(publicKey: Buffer, fabricId: bigint, nodeId: bigint): Buffer {
        const certId = this.nextCertificateId++;
        const unsignedCertificate = {
            serialNumber: Buffer.alloc(1, certId), // TODO: figure out what should happen if certId > 255
            signatureAlgorithm: 1 /* EcdsaWithSHA256 */ ,
            publicKeyAlgorithm: 1 /* EC */,
            ellipticCurveIdentifier: 1 /* P256v1 */,
            issuer: { issuerRcacId: this.rootCertId },
            notBefore: jsToMatterDate(new Date(), -1),
            notAfter: jsToMatterDate(new Date(), 10),
            subject: { fabricId, nodeId },
            ellipticCurvePublicKey: publicKey,
            extensions: {
                basicConstraints: { isCa: false },
                keyUsage: 1,
                extendedKeyUsage: [ 2, 1 ],
                subjectKeyIdentifier: Crypto.hash(publicKey),
                authorityKeyIdentifier: this.rootKeyIdentifier,
            },
        };
        const signature = Crypto.sign(this.rootKeyPair.privateKey, CertificateManager.nocCertToAsn1(unsignedCertificate));
        return TlvObjectCodec.encode({ ...unsignedCertificate, signature }, OperationalCertificateT);
    }
}
