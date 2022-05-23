import assert from "assert";
import ByteBuffer from "bytebuffer";
import { Crypto } from "../../src/crypto/Crypto";

const KEY = ByteBuffer.fromHex("ab f2 27 fe ff ea 8c 38 e6 88 dd cb ff c4 59 f1".replace(/ /g, "")).toBuffer();
const ENCRYPTED_DATA = ByteBuffer.fromHex("c4 52 7b d6 96 55 18 e8 38 2e".replace(/ /g, "")).toBuffer();
const PLAIN_DATA = ByteBuffer.fromHex("03 10 4f 3c 00 00 e9 8c eb 00".replace(/ /g, "")).toBuffer();
const NONCE = ByteBuffer.fromHex("00 0c e3 99 00 00 00 00 00 00 00 00 00".replace(/ /g, "")).toBuffer();
const ADDITIONAL_AUTH_DATA = ByteBuffer.fromHex("00 45 6a 00 0c e3 99 00".replace(/ /g, "")).toBuffer();
const TAG = ByteBuffer.fromHex("db bd 28 f2 7f 42 49 2d 07 66 12 4f 99 61 a7 72".replace(/ /g, "")).toBuffer();


const KEY_2 = ByteBuffer.fromHex("4e 4c 13 53 a1 33 39 7f 7a 75 57 c1 fb d9 ca 38".replace(/ /g, "")).toBuffer();
const ENCRYPTED_DATA_2 = ByteBuffer.fromHex("cb 50 87 1c cd 35 d4 30 b9 d9 f9 f2 a5 0c 07 f6 b0 e6 8a c7 8f 67 1d e6 70 bc 66 22 c3 53 8b 10 18 4a c5 8e 70 47 53 01 ed ae 3d".replace(/ /g, "")).toBuffer();
const PLAIN_DATA_2 = ByteBuffer.fromHex("06 09 52 3c 01 00 0f e3 99 00 15 28 00 36 01 15 35 01 37 00 24 00 00 24 01 3e 24 02 0b 18 35 01 24 00 00 18 18 18 18 24 ff 01 18".replace(/ /g, "")).toBuffer();
const NONCE_2 = ByteBuffer.fromHex("00 ec 8c eb 00 00 00 00 00 00 00 00 00".replace(/ /g, "")).toBuffer();
const ADDITIONAL_AUTH_DATA_2 = ByteBuffer.fromHex("00 c7 a2 00 ec 8c eb 00".replace(/ /g, "")).toBuffer();
const TAG_2 = ByteBuffer.fromHex("45 dd 16 9b fa d3 a4 36 7c b8 eb 82 16 76 b1 62".replace(/ /g, "")).toBuffer();

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
