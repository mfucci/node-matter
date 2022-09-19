import { SECURE_CHANNEL_PROTOCOL_ID } from "../session/secure/SecureChannelMessages";
import { SessionManager } from "../session/SessionManager";
import { NetInterface } from "../net/NetInterface";
import { ExchangeManager } from "./common/ExchangeManager";
import { PaseClient } from "../session/secure/PaseClient";
import { ClusterClient, InteractionClient } from "../interaction/InteractionClient";
import { INTERACTION_PROTOCOL_ID } from "../interaction/InteractionProtocol";
import { BasicClusterDef } from "../interaction/cluster/BasicCluster";
import { CommissioningError, GeneralCommissioningClusterDef, RegulatoryLocationType, SuccessFailureReponse } from "../interaction/cluster/GeneralCommissioningCluster";
import { OperationalCredentialsClusterDef } from "../interaction/cluster/OperationalCredentialsCluster";
import { CertificateSigningRequestT, CertificateType } from "../interaction/cluster/OperationalCredentialsMessages";
import { Crypto, KeyPair } from "../crypto/Crypto";
import { CertificateManager, jsToMatterDate, NocCertificate, NocCertificateT, RootCertificate, RootCertificateT } from "../crypto/CertificateManager";
import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { BYTES_KEY, DerCodec, EcdsaWithSHA256_X962, ELEMENTS_KEY, OBJECT_ID_KEY } from "../codec/DerCodec";

export class MatterClient {
    private readonly sessionManager = new SessionManager(this);
    private readonly exchangeManager = new ExchangeManager<MatterClient>(this.sessionManager);
    private readonly paseClient = new PaseClient();
    private readonly certificateManager = new RootCertificateManager();

    constructor(
        private readonly netInterface: NetInterface,
    ) {
        this.exchangeManager.addNetInterface(netInterface);
    }

    async commission(address: string, port: number, discriminator: number, setupPin: number) {
        const channel = await this.netInterface.openChannel(address, port);

        // Do PASE paring
        const paseSecureSession = await this.paseClient.pair(this, this.exchangeManager.initiateExchange(this.sessionManager.getUnsecureSession(), channel, SECURE_CHANNEL_PROTOCOL_ID), setupPin);

        // Use the created secure session to do the commissioning
        const interactionClient = new InteractionClient(() => this.exchangeManager.initiateExchange(paseSecureSession, channel, INTERACTION_PROTOCOL_ID));
        
        // Get and display the product name (just for debugging)
        const basicClusterClient = ClusterClient(interactionClient, 0, BasicClusterDef);
        const productName = await basicClusterClient.getProductName();
        console.log(`Paired with device: ${productName}`);

        // Do the commissioning
        const generalCommissioningClusterClient = ClusterClient(interactionClient, 0, GeneralCommissioningClusterDef);
        this.ensureSuccess(await generalCommissioningClusterClient.armFailSafe({ breadcrumb: 1, expiryLengthSeconds: 60 }));
        this.ensureSuccess(await generalCommissioningClusterClient.updateRegulatoryConfig({ breadcrumb: 2, config: RegulatoryLocationType.IndoorOutdoor, countryCode: "US"}));
        
        const operationalCredentialsClusterClient = ClusterClient(interactionClient, 0, OperationalCredentialsClusterDef);
        const { certificate: deviceAttestation } = await operationalCredentialsClusterClient.requestCertificateChain({ type: CertificateType.DeviceAttestation });
        // TODO: extract device public key from deviceAttestation
        const { certificate: productAttestation } = await operationalCredentialsClusterClient.requestCertificateChain({ type: CertificateType.ProductAttestationIntermediate });
        // TODO: validate deviceAttestation and productAttestation
        const { elements: attestationElements, signature: attestationSignature } = await operationalCredentialsClusterClient.requestAttestation({ nonce: Crypto.getRandomData(16) });
        // TODO: validate attestationSignature using device public key 
        const { elements: csrElements, signature: csrSignature } = await operationalCredentialsClusterClient.requestCsr({ nonce: Crypto.getRandomData(16) });
        // TOTO: validate csrSignature using device public key
        const { csr } = TlvObjectCodec.decode(csrElements, CertificateSigningRequestT);
        const operationalPublicKey = CertificateManager.getPublicKeyFromCsr(csr);
        
        await operationalCredentialsClusterClient.addTrustedRootCertificate({ certificate: this.certificateManager.getRootCert() });
        const fabricId = BigInt(1);
        const nodeId = BigInt(0);
        const peerNodeId = BigInt(1);
        const ipkValue = Crypto.getRandomData(16);
        const adminVendorId = 752;
        await operationalCredentialsClusterClient.addNoc({
            nocCert: this.certificateManager.generateNoc(operationalPublicKey, fabricId, peerNodeId),
            icaCert: Buffer.alloc(0),
            ipkValue,
            adminVendorId,
            caseAdminNode: nodeId,
        });
    }

    private ensureSuccess({ errorCode, debugText }: SuccessFailureReponse) {
        if (errorCode === CommissioningError.Ok) return;
        throw new Error(`Commission error: ${errorCode}, ${debugText}`);
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }

    close() {
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
            issuer: { rcacId: this.rootCertId },
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
            issuer: { rcacId: this.rootCertId },
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
        return TlvObjectCodec.encode({ ...unsignedCertificate, signature }, NocCertificateT);
    }
}
