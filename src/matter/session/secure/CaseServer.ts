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
import { KDFSR1_KEY_INFO, KDFSR2_INFO, KDFSR2_KEY_INFO, KDFSR3_INFO, RESUME1_MIC_NONCE, RESUME2_MIC_NONCE, TlvEncryptedDataSigma2, TlvSignedData, TBE_DATA2_NONCE, TBE_DATA3_NONCE, TlvEncryptedDataSigma3 } from "./CaseMessages";
import { TlvOperationalCertificate } from "../../certificate/CertificateManager";
import { SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { Logger } from "../../../log/Logger";
import { ByteArray } from "@project-chip/matter.js";

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
            const peerResumeKey = await Crypto.hkdf(sharedSecret, ByteArray.concat(peerRandom, peerResumptionId), KDFSR1_KEY_INFO);
            Crypto.decrypt(peerResumeKey, peerResumeMic, RESUME1_MIC_NONCE);

            // Generate sigma 2 resume
            const resumeSalt = ByteArray.concat(peerRandom, resumptionId);
            const resumeKey = await Crypto.hkdf(sharedSecret, resumeSalt, KDFSR2_KEY_INFO);
            const resumeMic = Crypto.encrypt(resumeKey, new ByteArray(0), RESUME2_MIC_NONCE);
            await messenger.sendSigma2Resume({ resumptionId, resumeMic, sessionId });

            // All good! Create secure session
            const secureSessionSalt = ByteArray.concat(peerRandom, peerResumptionId);
            const secureSession = await server.createSecureSession(sessionId, fabric, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, false, true, mrpParams?.idleRetransTimeoutMs, mrpParams?.activeRetransTimeoutMs);
            logger.info(`Case server: session ${secureSession.getId()} resumed with ${messenger.getChannelName()}`);
            resumptionRecord.resumptionId = resumptionId; /* Update the ID */

            // Wait for success on the peer side
            await messenger.waitForSuccess();
        } else {
            // Generate sigma 2
            const fabric = server.findFabricFromDestinationId(destinationId, peerRandom);
            const { operationalCert: nodeOpCert, intermediateCACert, operationalIdentityProtectionKey } = fabric;
            const { publicKey: ecdhPublicKey, sharedSecret } = Crypto.ecdhGeneratePublicKeyAndSecret(peerEcdhPublicKey);
            const sigma2Salt = ByteArray.concat(operationalIdentityProtectionKey, random, ecdhPublicKey, Crypto.hash(sigma1Bytes));
            const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
            const signatureData = TlvSignedData.encode({ nodeOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey });
            const signature = fabric.sign(signatureData);
            const encryptedData = TlvEncryptedDataSigma2.encode({ nodeOpCert, intermediateCACert, signature, resumptionId });
            const encrypted = Crypto.encrypt(sigma2Key, encryptedData, TBE_DATA2_NONCE);
            const sigma2Bytes = await messenger.sendSigma2({ random, sessionId, ecdhPublicKey, encrypted, mrpParams });

            // Read and process sigma 3
            const { sigma3Bytes, sigma3: {encrypted: peerEncrypted} } = await messenger.readSigma3();
            const sigma3Salt = ByteArray.concat(operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ]));
            const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
            const peerEncryptedData = Crypto.decrypt(sigma3Key, peerEncrypted, TBE_DATA3_NONCE);
            const { nodeOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature } = TlvEncryptedDataSigma3.decode(peerEncryptedData);
            fabric.verifyCredentials(peerNewOpCert, peerIntermediateCACert);
            const peerSignatureData = TlvSignedData.encode({ nodeOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey });
            const { ellipticCurvePublicKey: peerPublicKey, subject: { nodeId: peerNodeId } } = TlvOperationalCertificate.decode(peerNewOpCert);
            Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);

            // All good! Create secure session
            const secureSessionSalt = ByteArray.concat(operationalIdentityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ]));
            await server.createSecureSession(sessionId, fabric, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, false, false, mrpParams?.idleRetransTimeoutMs, mrpParams?.activeRetransTimeoutMs);
            logger.info(`Case server: session ${sessionId} created with ${messenger.getChannelName()}`);
            await messenger.sendSuccess();

            resumptionRecord = { peerNodeId, fabric, sharedSecret, resumptionId };
        }

        messenger.close();
        server.saveResumptionRecord(resumptionRecord);
    }
}
