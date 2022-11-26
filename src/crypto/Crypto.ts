/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import BN from "bn.js";
import crypto from "crypto";
import { util } from "@project-chip/matter.js";

const ENCRYPT_ALGORITHM = "aes-128-ccm";
const HASH_ALGORITHM = "sha256";
const EC_CURVE = "prime256v1";
const AUTH_TAG_LENGTH = 16;
const RANDOM_LENGTH = 32;
const SYMMETRIC_KEY_LENGTH = 16;

const EC_PRIVATE_KEY_PKCS8_HEADER = util.ByteArray.fromHex("308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420");
const EC_PUBLIC_KEY_SPKI_HEADER = util.ByteArray.fromHex("3059301306072a8648ce3d020106082a8648ce3d030107034200");

/** @see {@link spec.MatterCoreSpecificationV1_0} § 3.5.1 */
export const CRYPTO_GROUP_SIZE_BITS = 256;
export const CRYPTO_GROUP_SIZE_BYTES = 32;
export const CRYPTO_PUBLIC_KEY_SIZE_BYTES = (2 * CRYPTO_GROUP_SIZE_BYTES) + 1;
/** @see {@link spec.MatterCoreSpecificationV1_0} § 3.3 */
export const CRYPTO_HASH_LEN_BYTES = 32;
export const CRYPTO_HASH_BLOCK_LEN_BYTES = 64;
/** @see {@link spec.MatterCoreSpecificationV1_0} § 3.6 */
export const CRYPTO_SYMMETRIC_KEY_LENGTH_BITS = 128;
export const CRYPTO_SYMMETRIC_KEY_LENGTH_BYTES = 16;
export const CRYPTO_AEAD_MIC_LENGTH_BITS = 128;
export const CRYPTO_AEAD_MIC_LENGTH_BYTES = 16;
export const CRYPTO_AEAD_NONCE_LENGTH_BYTES = 13;

export interface KeyPair {
    publicKey: util.ByteArray,
    privateKey: util.ByteArray,
}

export class Crypto {
    static encrypt(key: util.ByteArray, data: util.ByteArray, nonce: util.ByteArray, aad?: util.ByteArray) {
        const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        if (aad !== undefined) {
            cipher.setAAD(aad, { plaintextLength: data.length})
        };
        const encrypted = cipher.update(data);
        cipher.final();
        return util.ByteArray.concat(encrypted, cipher.getAuthTag());
    }

    static decrypt(key: util.ByteArray, data: util.ByteArray, nonce: util.ByteArray, aad?: util.ByteArray) {
        const cipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        const plaintextLength = data.length - AUTH_TAG_LENGTH;
        if (aad !== undefined) {
            cipher.setAAD(aad, { plaintextLength })
        };
        cipher.setAuthTag(data.slice(plaintextLength));
        const result = cipher.update(data.slice(0, plaintextLength));
        cipher.final();
        return result;
    }

    static getRandomData(length: number): util.ByteArray {
        return crypto.randomBytes(length);
    }

    static getRandom(): util.ByteArray {
        return this.getRandomData(RANDOM_LENGTH);
    }

    static getRandomUInt16() {
        return crypto.randomBytes(2).readUInt16LE();
    }

    static getRandomUInt32() {
        return crypto.randomBytes(4).readUInt32LE();
    }

    static getRandomBN(size: number, maxValue: BN) {
        while (true) {
            const random = new BN(crypto.randomBytes(size));
            if (random < maxValue) return random;
        }
    }

    static ecdhGeneratePublicKey() {
        const ecdh = crypto.createECDH(EC_CURVE);
        ecdh.generateKeys();
        return {publicKey: ecdh.getPublicKey(), ecdh: ecdh};
    }

    static ecdhGeneratePublicKeyAndSecret(peerPublicKey: util.ByteArray) {
        const ecdh = crypto.createECDH(EC_CURVE);
        ecdh.generateKeys();
        return {publicKey: ecdh.getPublicKey(), sharedSecret: ecdh.computeSecret(peerPublicKey)};
    }

    static ecdhGenerateSecret(peerPublicKey: util.ByteArray, ecdh: crypto.ECDH) {
        return ecdh.computeSecret(peerPublicKey);
    }

    static hash(data: util.ByteArray | util.ByteArray[]) {
        const hasher = crypto.createHash(HASH_ALGORITHM);
        if (Array.isArray(data)) {
            data.forEach(chunk => hasher.update(chunk));
        } else {
            hasher.update(data);
        }
        return hasher.digest();
    }

    static pbkdf2(secret: util.ByteArray, salt: util.ByteArray, iteration: number, keyLength: number) {
        return new Promise<util.ByteArray>((resolver, rejecter) => {
            crypto.pbkdf2(secret, salt, iteration, keyLength, HASH_ALGORITHM, (error, key) => {
                if (error !== null) rejecter(error);
                resolver(key);
            });
        });
    }

    static hkdf(secret: util.ByteArray, salt: util.ByteArray, info: util.ByteArray, length: number = SYMMETRIC_KEY_LENGTH) {
        return new Promise<util.ByteArray>((resolver, rejecter) => {
            crypto.hkdf(HASH_ALGORITHM, secret, salt, info, length, (error, key) => {
                if (error !== null) rejecter(error);
                resolver(new util.ByteArray(key));
            });
        });
    }

    static hmac(key: util.ByteArray, data: util.ByteArray) {
        const hmac = crypto.createHmac(HASH_ALGORITHM, key);
        hmac.update(data);
        return hmac.digest();
    }

    static sign(privateKey: util.ByteArray, data: util.ByteArray | util.ByteArray[], dsaEncoding: ("ieee-p1363" | "der")  = "ieee-p1363") {
        const signer = crypto.createSign(HASH_ALGORITHM);
        if (Array.isArray(data)) {
            data.forEach(chunk => signer.update(chunk));
        } else {
            signer.update(data);
        }
        return signer.sign({
            key: Buffer.concat([EC_PRIVATE_KEY_PKCS8_HEADER, privateKey]), // key has to be a node.js Buffer object
            format: "der",
            type: "pkcs8",
            dsaEncoding,
        });
    }

    static verify(publicKey: util.ByteArray, data: util.ByteArray, signature: util.ByteArray, dsaEncoding: ("ieee-p1363" | "der")  = "ieee-p1363") {
        const verifier = crypto.createVerify(HASH_ALGORITHM);
        verifier.update(data);
        const success = verifier.verify({
            key: Buffer.concat([EC_PUBLIC_KEY_SPKI_HEADER, publicKey]), // key has to be a node.js Buffer object
            format: "der",
            type: "spki",
            dsaEncoding,
        }, signature);
        if (!success) throw new Error("Signature verification failed");
    }

    static createKeyPair(): KeyPair {
        const ecdh = crypto.createECDH(EC_CURVE);
        ecdh.generateKeys();
        return { publicKey: ecdh.getPublicKey(), privateKey: ecdh.getPrivateKey() };
    }
}
