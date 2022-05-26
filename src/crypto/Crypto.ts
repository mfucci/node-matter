import BN from "bn.js";
import crypto from "crypto";

const ENCRYPT_ALGORITHM = "aes-128-ccm";
const HASH_ALGORITHM = "sha256";
const AUTH_TAG_LENGTH = 16;

export class Crypto {
    static encrypt(key: Buffer, data: Buffer, nonce: Buffer, aad: Buffer) {
        const cipher = crypto.createCipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        cipher.setAAD(aad, { plaintextLength: data.length });
        const result = cipher.update(data);
        cipher.final();
        return { data: result, tag: cipher.getAuthTag()};
    }

    static decrypt(key: Buffer, data: Buffer, tag: Buffer, nonce: Buffer, aad: Buffer) {
        const cipher = crypto.createDecipheriv(ENCRYPT_ALGORITHM, key, nonce, { authTagLength: AUTH_TAG_LENGTH });
        cipher.setAAD(aad, { plaintextLength: data.length });
        cipher.setAuthTag(tag);
        const result = cipher.update(data);
        cipher.final();
        return result;
    }

    static getRandomData(size: number): Buffer {
        return crypto.randomBytes(size);
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

    static hkdf(secret: Buffer, salt: Buffer, info: Buffer, keyLength: number) {
        return new Promise<Buffer>((resolver, rejecter) => {
            crypto.hkdf(HASH_ALGORITHM, secret, salt, info, keyLength, (error, key) => {
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

    static sign(privateKey: Buffer, data: Buffer) {
        const sign = crypto.createSign(HASH_ALGORITHM);
        return sign.sign({ key: privateKey,  dsaEncoding: "ieee-p1363" });
    }
}
