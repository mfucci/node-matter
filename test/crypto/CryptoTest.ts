/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { Crypto } from "../../src/crypto/Crypto";
import crypto from "crypto";
import { ByteArray } from "@project-chip/matter.js";

const KEY = ByteArray.fromHex("abf227feffea8c38e688ddcbffc459f1");
const ENCRYPTED_DATA = ByteArray.fromHex("c4527bd6965518e8382edbbd28f27f42492d0766124f9961a772");
const PLAIN_DATA = ByteArray.fromHex("03104f3c0000e98ceb00");
const NONCE = ByteArray.fromHex("000ce399000000000000000000");
const ADDITIONAL_AUTH_DATA = ByteArray.fromHex("00456a000ce39900");


const KEY_2 = ByteArray.fromHex("4e4c1353a133397f7a7557c1fbd9ca38");
const ENCRYPTED_DATA_2 = ByteArray.fromHex("cb50871ccd35d430b9d9f9f2a50c07f6b0e68ac78f671de670bc6622c3538b10184ac58e70475301edae3d45dd169bfad3a4367cb8eb821676b162");
const PLAIN_DATA_2 = ByteArray.fromHex("0609523c01000fe399001528003601153501370024000024013e24020b1835012400001818181824ff0118");
const NONCE_2 = ByteArray.fromHex("00ec8ceb000000000000000000");
const ADDITIONAL_AUTH_DATA_2 = ByteArray.fromHex("00c7a200ec8ceb00");

const PRIVATE_KEY = ByteArray.fromHex("727F1005CBA47ED7822A9D930943621617CFD3B79D9AF528B801ECF9F1992204");
const PUBLIC_KEY = ByteArray.fromHex("0462e2b6e1baff8d74a6fd8216c4cb67a3363a31e691492792e61aee610261481396725ef95e142686ba98f339b0ff65bc338bec7b9e8be0bdf3b2774982476220");

describe("Crypto", () => {

    context("encrypt", () => {
        it("encrypts data", () => {
            const result = Crypto.encrypt(KEY_2, PLAIN_DATA_2, NONCE_2, ADDITIONAL_AUTH_DATA_2);

            assert.equal(result.toHex(), ENCRYPTED_DATA_2.toHex());
        });
    });

    context("decrypt", () => {
        it("decrypts data", () => {
            const result = Crypto.decrypt(KEY, ENCRYPTED_DATA, NONCE, ADDITIONAL_AUTH_DATA);

            assert.equal(result.toHex(), PLAIN_DATA.toHex());
        });
    });

    context("sign / verify", () => {
        it("signs data with known private key", () => {
            const result = Crypto.sign(PRIVATE_KEY, ENCRYPTED_DATA);

            Crypto.verify(PUBLIC_KEY, ENCRYPTED_DATA, result);
        });

        it("signs data with generated private key", () => {
            const ecdh = crypto.createECDH("prime256v1");
            ecdh.generateKeys();
            const result = Crypto.sign(ecdh.getPrivateKey(), ENCRYPTED_DATA);

            Crypto.verify(ecdh.getPublicKey(), ENCRYPTED_DATA, result);
        });
    });

    context("createKeyPair", () => {
        it("generates a working key pair", () => {
            const { privateKey, publicKey } = Crypto.createKeyPair();

            Crypto.verify(publicKey, ENCRYPTED_DATA, Crypto.sign(privateKey, ENCRYPTED_DATA));
        });
    });
});
