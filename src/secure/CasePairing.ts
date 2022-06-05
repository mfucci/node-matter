import { Crypto } from "../crypto/Crypto";
import { getFabricManager } from "../fabric/FabricManager";
import { MessageExchange } from "../transport/Dispatcher";
import { CaseMessenger } from "./CaseMessenger";
import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { TagBasedEcryptionDataT, TagBasedSignatureDataT } from "./CaseMessages";
import { getSessionManager, SessionManager } from "../session/SessionManager";
import { CertificateT } from "../fabric/TlvCertificate";

const KDFSR2_INFO = Buffer.from("Sigma2");
const KDFSR3_INFO = Buffer.from("Sigma3");
const TBE_DATA2_NONCE = Buffer.from("NCASE_Sigma2N");
const TBE_DATA3_NONCE = Buffer.from("NCASE_Sigma3N");

export class CasePairing {
    private readonly sessionManager: SessionManager = getSessionManager();

    async onNewExchange(exchange: MessageExchange) {
        const messenger = new CaseMessenger(exchange);
        try {
            await this.handleSigma1(messenger);
        } catch (error) {
            console.log("An error occured during the commissioning", error);
            await messenger.sendError();
        }
    }

    private async handleSigma1(messenger: CaseMessenger) {
        // Generate pairing info
        const sessionId = this.sessionManager.getNextAvailableSessionId();
        const random = Crypto.getRandom();

        console.log("Read and process sigma 1");

        // Read and process sigma 1
        const { sigma1Bytes, sigma1  } = await messenger.readSigma1();
        const { sessionId: peerSessionId, resumptionId: peerResumptionId, destinationId, random: peerRandom, ecdhPublicKey: peerEcdhPublicKey, mrpParams } = sigma1;
        if (peerResumptionId !== undefined) throw new Error("CASE session resume not supported");
        const fabric = getFabricManager().findFabricFromDestinationId(destinationId, peerRandom);
        const { newOpCert, intermediateCACert, identityProtectionKey } = fabric;
        const { publicKey: ecdhPublicKey, sharedSecret } = Crypto.ecdh(peerEcdhPublicKey);

        // Generate sigma 2
        console.log("Generate sigma 2");
        const sigma2Salt = Buffer.concat([ identityProtectionKey, random, ecdhPublicKey, Crypto.hash(sigma1Bytes) ]);
        const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
        const signatureData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey }, TagBasedSignatureDataT);
        const signature = fabric.sign(signatureData);
        const resumptionId = Crypto.getRandomData(16);
        const encryptedData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, signature, resumptionId }, TagBasedEcryptionDataT);
        const encrypted = Crypto.encrypt(sigma2Key, encryptedData, TBE_DATA2_NONCE);
        const sigma2Bytes = await messenger.sendSigma2({ random, sessionId, ecdhPublicKey, encrypted, mrpParams });

        console.log("Read and process sigma 3");
        // Read and process sigma 3
        const { sigma3Bytes, sigma3: {encrypted: peerEncrypted} } = await messenger.readSigma3();
        const sigma3Salt = Buffer.concat([ identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ]) ]);
        const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
        const peerEncryptedData = Crypto.decrypt(sigma3Key, peerEncrypted, TBE_DATA3_NONCE);
        const { newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature } = TlvObjectCodec.decode(peerEncryptedData, TagBasedEcryptionDataT);
        fabric.verifyCredentials(peerNewOpCert, peerIntermediateCACert);
        const peerSignatureData = TlvObjectCodec.encode({ newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey }, TagBasedSignatureDataT);
        const peerPublicKey = TlvObjectCodec.decode(peerNewOpCert, CertificateT).ellipticCurvePublicKey;
        Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);

        console.log("All good!");
        // All good! Create secure session
        const secureSessionSalt = Buffer.concat([identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ])]);
        await this.sessionManager.createSecureSession(sessionId, peerSessionId, sharedSecret, secureSessionSalt, false);
        await messenger.sendSuccess();
    }
}
