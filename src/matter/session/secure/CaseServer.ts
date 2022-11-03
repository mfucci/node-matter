/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../../../crypto/Crypto";
import { MatterDevice } from "../../MatterDevice";
import { ProtocolHandler } from "../../common/ProtocolHandler";
import { MessageExchange } from "../../common/MessageExchange";
import { CaseServerMessenger } from "./CaseMessenger";
import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { KDFSR1_KEY_INFO, KDFSR2_INFO, KDFSR2_KEY_INFO, KDFSR3_INFO, RESUME1_MIC_NONCE, RESUME2_MIC_NONCE, EncryptedDataSigma2T, SignedDataT, TBE_DATA2_NONCE, TBE_DATA3_NONCE, EncryptedDataSigma3T } from "./CaseMessages";
import { OperationalCertificateT } from "../../certificate/CertificateManager";
import { SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { Logger } from "../../../log/Logger";

const logger = Logger.get("CaseServer");

export class CaseServer implements ProtocolHandler<MatterDevice> {
    async onNewExchange(exchange: MessageExchange<MatterDevice>) {
        const messenger = new CaseServerMessenger(exchange);
        try {
            await this.handleSigma1(exchange.session.getContext(), messenger);
        } catch (error) {
            logger.error("An error occured during the commissioning", error);
            await messenger.sendError();
        }
    }

    getId(): number {
        return SECURE_CHANNEL_PROTOCOL_ID;
    }

    private async handleSigma1(server: MatterDevice, messenger: CaseServerMessenger) {
        logger.info(`Case server: Received pairing request from ${messenger.getChannelName()}`);
        // Generate pairing info
        const sessionId = server.getNextAvailableSessionId();
        const random = Crypto.getRandom();

        // Read and process sigma 1
        const { sigma1Bytes, sigma1 } = await messenger.readSigma1();
        const { sessionId: peerSessionId, resumptionId: peerResumptionId, resumeMic: peerResumeMic, destinationId, random: peerRandom, ecdhPublicKey: peerEcdhPublicKey, mrpParams } = sigma1;
  
        // Try to resume a previous session
        const resumptionId = Crypto.getRandomData(16);
        let resumptionRecord;
        if (peerResumptionId !== undefined && peerResumeMic !== undefined && (resumptionRecord = server.findResumptionRecordById(peerResumptionId)) !== undefined) {
            const { sharedSecret, fabric, peerNodeId } = resumptionRecord;
            const peerResumeKey = await Crypto.hkdf(sharedSecret, Buffer.concat([peerRandom, peerResumptionId]), KDFSR1_KEY_INFO);
            Crypto.decrypt(peerResumeKey, peerResumeMic, RESUME1_MIC_NONCE);

            // Generate sigma 2 resume
            const resumeSalt = Buffer.concat([peerRandom, resumptionId]);
            const resumeKey = await Crypto.hkdf(sharedSecret, resumeSalt, KDFSR2_KEY_INFO);
            const resumeMic = Crypto.encrypt(resumeKey, Buffer.alloc(0), RESUME2_MIC_NONCE);
            await messenger.sendSigma2Resume({ resumptionId, resumeMic, sessionId });

            // All good! Create secure session
            const secureSessionSalt = Buffer.concat([peerRandom, peerResumptionId]);
            const secureSession = await server.createSecureSession(sessionId, fabric, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, false, true, mrpParams?.idleRetransTimeoutMs, mrpParams?.activeRetransTimeoutMs);
            logger.info(`Case server: session ${secureSession.getId()} resumed with ${messenger.getChannelName()}`);
            resumptionRecord.resumptionId = resumptionId; /* Update the ID */

            // Wait for success on the peer side
            await messenger.waitForSuccess();
        } else {
            // Generate sigma 2
            const fabric = server.findFabricFromDestinationId(destinationId, peerRandom);
            const { operationalCert: newOpCert, intermediateCACert, operationalIdentityProtectionKey } = fabric;
            const { publicKey: ecdhPublicKey, sharedSecret } = Crypto.ecdhGeneratePublicKeyAndSecret(peerEcdhPublicKey);
            const sigma2Salt = Buffer.concat([ operationalIdentityProtectionKey, random, ecdhPublicKey, Crypto.hash(sigma1Bytes) ]);
            const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
            const signatureData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey }, SignedDataT);
            const signature = fabric.sign(signatureData);
            const encryptedData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, signature, resumptionId }, EncryptedDataSigma2T);
            const encrypted = Crypto.encrypt(sigma2Key, encryptedData, TBE_DATA2_NONCE);
            const sigma2Bytes = await messenger.sendSigma2({ random, sessionId, ecdhPublicKey, encrypted, mrpParams });

            // Read and process sigma 3
            const { sigma3Bytes, sigma3: {encrypted: peerEncrypted} } = await messenger.readSigma3();
            const sigma3Salt = Buffer.concat([ operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ]) ]);
            const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
            const peerEncryptedData = Crypto.decrypt(sigma3Key, peerEncrypted, TBE_DATA3_NONCE);
            const { newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature } = TlvObjectCodec.decode(peerEncryptedData, EncryptedDataSigma3T);
            fabric.verifyCredentials(peerNewOpCert, peerIntermediateCACert);
            const peerSignatureData = TlvObjectCodec.encode({ newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey }, SignedDataT);
            const { ellipticCurvePublicKey: peerPublicKey, subject: { nodeId: peerNodeId } } = TlvObjectCodec.decode(peerNewOpCert, OperationalCertificateT);
            Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);

            // All good! Create secure session
            const secureSessionSalt = Buffer.concat([operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ])]);
            await server.createSecureSession(sessionId, fabric, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, false, false, mrpParams?.idleRetransTimeoutMs, mrpParams?.activeRetransTimeoutMs);
            logger.info(`Case server: session ${sessionId} created with ${messenger.getChannelName()}`);
            await messenger.sendSuccess();

            resumptionRecord = { peerNodeId, fabric, sharedSecret, resumptionId };
        }

        messenger.close();
        server.saveResumptionRecord(resumptionRecord);
    }
}
