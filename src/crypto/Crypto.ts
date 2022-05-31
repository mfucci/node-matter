import BN from "bn.js";
import crypto from "crypto";

const ENCRYPT_ALGORITHM = "aes-128-ccm";
const HASH_ALGORITHM = "sha256";
const EC_CURVE = "prime256v1";
const AUTH_TAG_LENGTH = 16;
const RANDOM_LENGTH = 32;
const SYMMETRIC_KEY_LENGTH = 16;

export interface KeyPair {
    publicKey: Buffer,
    privateKey: Buffer,
}

export class Crypto {
    static encrypt(key: Buffer, data: Buffer, nonce: Buffer, aad?: Buffer) {
        const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        if (aad !== undefined) {
            cipher.setAAD(aad, { plaintextLength: data.length })
        };
        const encrypted = cipher.update(data);
        cipher.final();
        return Buffer.concat([ encrypted, cipher.getAuthTag()]);
    }

    static decrypt(key: Buffer, data: Buffer, nonce: Buffer, aad?: Buffer) {
        const cipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        if (aad !== undefined) {
            cipher.setAAD(aad, { plaintextLength: data.length })
        };
        const encrypted = data.slice(0, data.length - AUTH_TAG_LENGTH);
        const tag = data.slice(data.length - AUTH_TAG_LENGTH);
        cipher.setAuthTag(tag);
        const result = cipher.update(encrypted);
        cipher.final();
        return result;
    }

    static getRandomData(length: number): Buffer {
        return crypto.randomBytes(length);
    }

    static getRandom(): Buffer {
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

    static ecdh(publicKey: Buffer) {
        const ecdh = crypto.createECDH(EC_CURVE);
        return {publicKey: ecdh.getPublicKey(), sharedSecret: ecdh.computeSecret(publicKey)};
    }

    static hash(data: Buffer | Buffer[]) {
        const hasher = crypto.createHash(HASH_ALGORITHM);
        if (Array.isArray(data)) {
            data.forEach(chunk => hasher.update(chunk));
        } else {
            hasher.update(data);
        }
        return hasher.digest();
    }

    static pbkdf2(secret: Buffer, salt: Buffer, iteration: number, keyLength: number) {
        return new Promise<Buffer>((resolver, rejecter) => {
            crypto.pbkdf2(secret, salt, iteration, keyLength, HASH_ALGORITHM, (error, key) => {
                if (error !== null) rejecter(error);
                resolver(key);
            });
        });
    }

    static hkdf(secret: Buffer, salt: Buffer, info: Buffer) {
        return new Promise<Buffer>((resolver, rejecter) => {
            crypto.hkdf(HASH_ALGORITHM, secret, salt, info, SYMMETRIC_KEY_LENGTH, (error, key) => {
                if (error !== null) rejecter(error);
                resolver(Buffer.from(key));
            });
        });
    }

    static hmac(key: Buffer, data: Buffer) {
        const hmac = crypto.createHmac(HASH_ALGORITHM, key);
        hmac.update(data);
        return hmac.digest();
    }

    static sign(privateKey: Buffer, data: Buffer | Buffer[]) {
        const signer = crypto.createSign(HASH_ALGORITHM);
        if (Array.isArray(data)) {
            data.forEach(chunk => signer.update(chunk));
        } else {
            signer.update(data);
        }
        return signer.sign({ key: privateKey,  dsaEncoding: "ieee-p1363" });
    }

    static verify(publicKey: Buffer, data: Buffer, signature: Buffer) {
        const verifier = crypto.createVerify(HASH_ALGORITHM);
        verifier.update(data);
        const success = verifier.verify({ key: publicKey,  dsaEncoding: "ieee-p1363" }, signature);
        if (!success) throw new Error("Signature verification failed");
    }

    static async createKeyPair(): Promise<KeyPair> {
        return new Promise<KeyPair>((resolver, rejecter) => {
            crypto.generateKeyPair("ec", { namedCurve: EC_CURVE }, (error, publicKey, privateKey) => {
                if (error !== null) rejecter(error);
                resolver({ publicKey: publicKey.export(), privateKey: privateKey.export() });
            });
        });
    }
}
