/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { NocCertificateT } from "../../crypto/CertificateManager";
import { Crypto } from "../../crypto/Crypto";
import { Fabric } from "../../fabric/Fabric";
import { MessageExchange } from "../../matter/common/MessageExchange";
import { MatterClient } from "../../matter/MatterClient";
import { KDFSR2_INFO, KDFSR3_INFO, TagBasedEcryptionDataT, TagBasedSignatureDataT, TBE_DATA2_NONCE, TBE_DATA3_NONCE } from "./CaseMessages";
import { CaseClientMessenger } from "./CaseMessenger";

export class CaseClient {
    constructor() {}

    async pair(client: MatterClient, exchange: MessageExchange<MatterClient>, fabric: Fabric, peerNodeId: bigint) {
        const messenger = new CaseClientMessenger(exchange);

        // Generate pairing info
        const random = Crypto.getRandom();
        const sessionId = client.getNextAvailableSessionId();
        const { identityProtectionKey, newOpCert, intermediateCACert, nodeId } = fabric;
        const { publicKey: ecdhPublicKey, ecdh } = Crypto.ecdhGeneratePublicKey();

        // Send sigma1
        const sigma1Bytes = await messenger.sendSigma1({sessionId, destinationId: fabric.getDestinationId(peerNodeId, random), ecdhPublicKey, random});

        // Read and process sigma2
        const { sigma2Bytes, sigma2 } = await messenger.readSigma2();
        const { ecdhPublicKey: peerEcdhPublicKey, encrypted: peerEncrypted, random: peerRandom, sessionId: peerSessionId } = sigma2;
        const sharedSecret = Crypto.ecdhGenerateSecret(peerEcdhPublicKey, ecdh);
        const sigma2Salt = Buffer.concat([ identityProtectionKey, peerRandom, peerEcdhPublicKey, Crypto.hash(sigma1Bytes) ]);
        const sigma2Key = await Crypto.hkdf(sharedSecret, sigma2Salt, KDFSR2_INFO);
        const peerEncryptedData = Crypto.encrypt(sigma2Key, peerEncrypted, TBE_DATA2_NONCE);
        const { newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, signature: peerSignature } = TlvObjectCodec.decode(peerEncryptedData, TagBasedEcryptionDataT);
        const peerSignatureData = TlvObjectCodec.encode({ newOpCert: peerNewOpCert, intermediateCACert: peerIntermediateCACert, ecdhPublicKey: peerEcdhPublicKey, peerEcdhPublicKey: ecdhPublicKey }, TagBasedSignatureDataT);
        const { ellipticCurvePublicKey: peerPublicKey, subject: { nodeId: peerNodeIdCert } } = TlvObjectCodec.decode(peerNewOpCert, NocCertificateT);
        if (peerNodeIdCert !== peerNodeId) throw new Error("The node ID in the peer certificate doesn't match the expected peer node ID");
        Crypto.verify(peerPublicKey, peerSignatureData, peerSignature);

        // Generate and send sigma3
        const sigma3Salt = Buffer.concat([ identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes ]) ]);
        const sigma3Key = await Crypto.hkdf(sharedSecret, sigma3Salt, KDFSR3_INFO);
        const signatureData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, ecdhPublicKey, peerEcdhPublicKey }, TagBasedSignatureDataT);
        const signature = fabric.sign(signatureData);
        const encryptedData = TlvObjectCodec.encode({ newOpCert, intermediateCACert, signature }, TagBasedEcryptionDataT);
        const encrypted = Crypto.encrypt(sigma3Key, encryptedData, TBE_DATA3_NONCE);
        const sigma3Bytes = await messenger.sendSigma3({ encrypted });
        await messenger.waitForSuccess();
 
        // All good! Create secure session
        const secureSessionSalt = Buffer.concat([identityProtectionKey, Crypto.hash([ sigma1Bytes, sigma2Bytes, sigma3Bytes ])]);
        const secureSession = await client.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, secureSessionSalt, true);
        console.log(`Case client: Paired succesfully with ${messenger.getChannelName()}`);
        return secureSession;
    }
}
