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
import { CertificateType } from "../interaction/cluster/OperationalCredentialsMessages";
import { Crypto } from "../crypto/Crypto";

export class MatterClient {
    private readonly sessionManager = new SessionManager(this);
    private readonly exchangeManager = new ExchangeManager<MatterClient>(this.sessionManager);
    private readonly paseClient = new PaseClient();

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
        const { certificate: productAttestation } = await operationalCredentialsClusterClient.requestCertificateChain({ type: CertificateType.ProductAttestationIntermediate });
        const { elements: attestationElements, signature: attestationSignature } = await operationalCredentialsClusterClient.requestAttestation({ nonce: Crypto.getRandomData(16) });
        const { elements: csrElements, signature: csrSignature } = await operationalCredentialsClusterClient.requestCsr({ nonce: Crypto.getRandomData(16) });
        // TODO await operationalCredentialsClusterClient.addTrustedRootCertificate({ certificate:  });
        // TODO await operationalCredentialsClusterClient.addNoc({ nocCert, icaCert, ipkValue, adminVendorId, caseAdminNode });
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
