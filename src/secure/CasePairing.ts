import { Crypto } from "../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { getFabricManager } from "../fabric/FabricManager";
import { MessageExchange } from "../transport/Dispatcher";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { CaseMessenger } from "./CaseMessenger";
import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { TagBasedEcryptionDataT, TagBasedSignatureDataT } from "./CaseMessages";
import { getSessionManager, SessionManager } from "../session/SessionManager";
import { NewOpCertificateT } from "../fabric/NewOpCertificate";

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

        // Read and process sigma 1
        const { sigma1Bytes, sigma1  } = await messenger.readSigma1();
        const { sessionId: peerSessionId, resumptionId: peerResumptionId, destinationId, random: peerRandom, ecdhPublicKey: peerEcdhPublicKey, mrpParams } = sigma1;
        if (peerResumptionId !== undefined) throw new Error("CASE session resume not supported");
        const { identityProtectionKey, fabric } = this.findFabricFromDestinationId(destinationId, peerRandom);
        const { newOpCert, intermediateCACert } = fabric;
        const { publicKey: ecdhPublicKey, sharedSecret } = Crypto.ecdh(peerEcdhPublicKey);

        // Generate sigma 2
        const sigma2Salt = Crypto.hash([ identityProtectionKey, random, peerEcdhPublicKey, Crypto.hash(sigma1Bytes) ]);
        const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
        const signatureData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey: peerEcdhPublicKey }, TagBasedSignatureDataT);
        const signature = fabric.sign(signatureData);
        const resumptionId = Crypto.getRandomData(16);
        const encryptedData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, signature, resumptionId }, TagBasedEcryptionDataT);
        const encrypted = Crypto.encrypt(sigma2Key, encryptedData, TBE_DATA2_NONCE);
        const sigma2Bytes = await messenger.sendSigma2({ random, sessionId, ecdhPublicKey, encrypted, mrpParams });

        // Read and process sigma 3
        const { sigma3Bytes, sigma3: {encrypted: peerEncrypted} } = await messenger.readSigma3();
        const sigma3Salt = Crypto.hash([identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ])]);
        const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
        const peerEncryptedData = Crypto.decrypt(sigma3Key, peerEncrypted, TBE_DATA3_NONCE);
        const { newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature } = TlvObjectCodec.decode(peerEncryptedData, TagBasedEcryptionDataT);
        fabric.verifyCredentials(peerNewOpCert, peerIntermediateCACert);
        const peerSignatureData = TlvObjectCodec.encode({ newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey }, TagBasedSignatureDataT);
        const peerPublicKey = TlvObjectCodec.decode(peerNewOpCert, NewOpCertificateT).ellipticCurvePublicKey;
        Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);

        // All good! Create secure session
        const secureSessionSalt = Buffer.concat([identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ])]);
        await this.sessionManager.createSecureSession(sessionId, peerSessionId, sharedSecret, secureSessionSalt, false);
    }

    private findFabricFromDestinationId(destinationId: Buffer, initiatorRandom: Buffer) {
        var result: {identityProtectionKey: Buffer, fabric: Fabric} | undefined;

        getFabricManager().getFabrics().forEach(fabric => {
            const writter = new LEBufferWriter();
            writter.writeBytes(initiatorRandom);
            writter.writeBytes(fabric.rootPublicKey);
            writter.writeUInt64(BigInt(fabric.id));
            writter.writeUInt64(BigInt(fabric.nodeId));
            const elements = writter.toBuffer();

            fabric.getIdentityProtectionKeySet()?.getKeys().forEach(identityProtectionKey => {
                const candidateDestinationId = Crypto.hmac(identityProtectionKey, elements);
                if (candidateDestinationId.equals(destinationId)) {
                    result = {identityProtectionKey, fabric};
                }
            })
        });
        
        if (result === undefined) throw new Error("Fabric cannot be found from destinationId");
        return result;
    }
}
