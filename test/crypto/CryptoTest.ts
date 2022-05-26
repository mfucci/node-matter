import assert from "assert";
import { Crypto } from "../../src/crypto/Crypto";

const KEY = Buffer.from("abf227feffea8c38e688ddcbffc459f1", "hex");
const ENCRYPTED_DATA = Buffer.from("c4527bd6965518e8382e", "hex");
const PLAIN_DATA = Buffer.from("03104f3c0000e98ceb00", "hex");
const NONCE = Buffer.from("000ce399000000000000000000", "hex");
const ADDITIONAL_AUTH_DATA = Buffer.from("00456a000ce39900", "hex");
const TAG = Buffer.from("dbbd28f27f42492d0766124f9961a772", "hex");


const KEY_2 = Buffer.from("4e4c1353a133397f7a7557c1fbd9ca38", "hex");
const ENCRYPTED_DATA_2 = Buffer.from("cb50871ccd35d430b9d9f9f2a50c07f6b0e68ac78f671de670bc6622c3538b10184ac58e70475301edae3d", "hex");
const PLAIN_DATA_2 = Buffer.from("0609523c01000fe399001528003601153501370024000024013e24020b1835012400001818181824ff0118", "hex");
const NONCE_2 = Buffer.from("00ec8ceb000000000000000000", "hex");
const ADDITIONAL_AUTH_DATA_2 = Buffer.from("00c7a200ec8ceb00", "hex");
const TAG_2 = Buffer.from("45dd169bfad3a4367cb8eb821676b162", "hex");

describe("Crypto", () => {

    context("encrypt", () => {
        it("encrypts data", () => {
            const {data, tag} = Crypto.encrypt(KEY_2, PLAIN_DATA_2, NONCE_2, ADDITIONAL_AUTH_DATA_2);

            assert.equal(tag.toString("hex"), TAG_2.toString("hex"));
            assert.equal(data.toString("hex"), ENCRYPTED_DATA_2.toString("hex"));
        });
    });

    context("decrypt", () => {
        it("decrypts data", () => {
            const result = Crypto.decrypt(KEY, ENCRYPTED_DATA, TAG, NONCE, ADDITIONAL_AUTH_DATA);

            assert.equal(result.toString("hex"), PLAIN_DATA.toString("hex"));
        });
    });
});
