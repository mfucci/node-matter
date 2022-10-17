/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { OperationalCertificateT } from "../../certificate/CertificateManager";
import { Crypto } from "../../../crypto/Crypto";
import { Fabric } from "../../fabric/Fabric";
import { MessageExchange } from "../../common/MessageExchange";
import { MatterController } from "../../MatterController";
import { KDFSR1_KEY_INFO, KDFSR2_INFO, KDFSR2_KEY_INFO, KDFSR3_INFO, RESUME1_MIC_NONCE, RESUME2_MIC_NONCE, EncryptedDataSigma2T, SignedDataT, TBE_DATA2_NONCE, TBE_DATA3_NONCE, EncryptedDataSigma3T } from "./CaseMessages";
import { CaseClientMessenger } from "./CaseMessenger";
import { Logger } from "../../../log/Logger";

const logger = Logger.get("CaseClient");

export class CaseClient {
    constructor() {}

    async pair(client: MatterController, exchange: MessageExchange<MatterController>, fabric: Fabric, peerNodeId: bigint) {
        const messenger = new CaseClientMessenger(exchange);

        // Generate pairing info
        const random = Crypto.getRandom();
        const sessionId = client.getNextAvailableSessionId();
        const { operationalIdentityProtectionKey, operationalCert: newOpCert, intermediateCACert, nodeId } = fabric;
        const { publicKey: ecdhPublicKey, ecdh } = Crypto.ecdhGeneratePublicKey();

        // Send sigma1
        let sigma1Bytes;
        let resumptionRecord = client.findResumptionRecordByNodeId(peerNodeId);
        if (resumptionRecord !== undefined) {
            const { sharedSecret, resumptionId } = resumptionRecord;
            const resumeKey = await Crypto.hkdf(sharedSecret, Buffer.concat([random, resumptionId]), KDFSR1_KEY_INFO);
            const resumeMic = Crypto.encrypt(resumeKey, Buffer.alloc(0), RESUME1_MIC_NONCE);
            sigma1Bytes = await messenger.sendSigma1({ sessionId, destinationId: fabric.getDestinationId(peerNodeId, random), ecdhPublicKey, random, resumptionId, resumeMic });
        } else {
            sigma1Bytes = await messenger.sendSigma1({sessionId, destinationId: fabric.getDestinationId(peerNodeId, random), ecdhPublicKey, random});
        }

        let secureSession;
        const { sigma2Bytes, sigma2, sigma2Resume } = await messenger.readSigma2();
        if (sigma2Resume !== undefined) {
            // Process sigma2 resume
            if (resumptionRecord === undefined) throw new Error("Received an unexpected sigma2Resume");
            const { sharedSecret, fabric } = resumptionRecord;
            const { sessionId: peerSessionId, resumptionId, resumeMic } = sigma2Resume;

            const resumeSalt = Buffer.concat([random, resumptionId]);
            const resumeKey = await Crypto.hkdf(sharedSecret, resumeSalt, KDFSR2_KEY_INFO);
            Crypto.decrypt(resumeKey, resumeMic, RESUME2_MIC_NONCE);

            const secureSessionSalt = Buffer.concat([random, resumptionRecord.resumptionId]);
            secureSession = await client.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, true, true);
            secureSession.setFabric(fabric);
            await messenger.sendSuccess();
            logger.info(`Case client: session resumed with ${messenger.getChannelName()}`);

            resumptionRecord.resumptionId = resumptionId; /* update resumptionId */
        } else {
            // Process sigma2
            const { ecdhPublicKey: peerEcdhPublicKey, encrypted: peerEncrypted, random: peerRandom, sessionId: peerSessionId } = sigma2;
            const sharedSecret = Crypto.ecdhGenerateSecret(peerEcdhPublicKey, ecdh);
            const sigma2Salt = Buffer.concat([ operationalIdentityProtectionKey, peerRandom, peerEcdhPublicKey, Crypto.hash(sigma1Bytes) ]);
            const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
            const peerEncryptedData = Crypto.decrypt(sigma2Key, peerEncrypted, TBE_DATA2_NONCE);
            const { newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature, resumptionId: peerResumptionId } = TlvObjectCodec.decode(peerEncryptedData, EncryptedDataSigma2T);
            const peerSignatureData = TlvObjectCodec.encode({ newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey }, SignedDataT);
            const { ellipticCurvePublicKey: peerPublicKey, subject: { nodeId: peerNodeIdCert } } = TlvObjectCodec.decode(peerNewOpCert, OperationalCertificateT);
            if (peerNodeIdCert !== peerNodeId) throw new Error("The node ID in the peer certificate doesn't match the expected peer node ID");
            Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);
    
            // Generate and send sigma3
            const sigma3Salt = Buffer.concat([ operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ]) ]);
            const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
            const signatureData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey }, SignedDataT);
            const signature = fabric.sign(signatureData);
            const encryptedData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, signature }, EncryptedDataSigma3T);
            const encrypted = Crypto.encrypt(sigma3Key, encryptedData, TBE_DATA3_NONCE);
            const sigma3Bytes = await messenger.sendSigma3({ encrypted });
            await messenger.waitForSuccess();
     
            // All good! Create secure session
            const secureSessionSalt = Buffer.concat([operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ])]);
            secureSession = await client.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, true, false);
            secureSession.setFabric(fabric);
            logger.info(`Case client: Paired succesfully with ${messenger.getChannelName()}`);
            resumptionRecord = {fabric, peerNodeId, sharedSecret, resumptionId: peerResumptionId };
        }

        messenger.close();
        client.saveResumptionRecord(resumptionRecord);

        return secureSession;
    }
}
