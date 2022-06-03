import BN from "bn.js";
import crypto from "crypto";

const ENCRYPT_ALGORITHM = "aes-128-ccm";
const HASH_ALGORITHM = "sha256";
const EC_CURVE = "prime256v1";
const AUTH_TAG_LENGTH = 16;
const RANDOM_LENGTH = 32;
const SYMMETRIC_KEY_LENGTH = 16;

const EC_PRIVATE_KEY_PKCS8_HEADER = Buffer.from("308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420", "hex");
const EC_PUBLIC_KEY_SPKI_HEADER = Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex");

export interface KeyPair {
    publicKey: Buffer,
    privateKey: Buffer,
}

export class Crypto {
    static encrypt(key: Buffer, data: Buffer, nonce: Buffer, aad?: Buffer) {
        const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        if (aad !== undefined) {
            cipher.setAAD(aad, { plaintextLength: data.length})
        };
        const encrypted = cipher.update(data);
        cipher.final();
        return Buffer.concat([ encrypted, cipher.getAuthTag()]);
    }

    static decrypt(key: Buffer, data: Buffer, nonce: Buffer, aad?: Buffer) {
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
        ecdh.generateKeys();
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

    static hkdf(secret: Buffer, salt: Buffer, info: Buffer, length: number = SYMMETRIC_KEY_LENGTH) {
        return new Promise<Buffer>((resolver, rejecter) => {
            crypto.hkdf(HASH_ALGORITHM, secret, salt, info, length, (error, key) => {
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

    static sign(privateKey: Buffer, data: Buffer | Buffer[], dsaEncoding:("ieee-p1363" | "der")  = "ieee-p1363") {
        const signer = crypto.createSign(HASH_ALGORITHM);
        if (Array.isArray(data)) {
            data.forEach(chunk => signer.update(chunk));
        } else {
            signer.update(data);
        }
        return signer.sign({ key: Buffer.concat([EC_PRIVATE_KEY_PKCS8_HEADER, privateKey]), format: "der", type: "pkcs8", dsaEncoding });
    }
    
    static verify(publicKey: Buffer, data: Buffer, signature: Buffer) {
        const verifier = crypto.createVerify(HASH_ALGORITHM);
        verifier.update(data);
        const success = verifier.verify({ key: Buffer.concat([EC_PUBLIC_KEY_SPKI_HEADER, publicKey]), format: "der", type: "spki",  dsaEncoding: "ieee-p1363" }, signature);
        if (!success) throw new Error("Signature verification failed");
    }

    static createKeyPair(): KeyPair {
        const ecdh = crypto.createECDH(EC_CURVE);
        ecdh.generateKeys();
        return { publicKey: ecdh.getPublicKey(), privateKey: ecdh.getPrivateKey() };
    }
}
