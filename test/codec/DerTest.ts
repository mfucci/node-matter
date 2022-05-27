import assert from "assert";
import { DerCodec } from "../../src/codec/DerCodec";

const DECODED = {
    request: {
        version: 0,
        subject: {
            organization: [{
                id: {_objectId: Buffer.from("55040A", "hex")},
                name: "CSR",
            }],
        },
        publicKey: {
            type: {
                algorithm: {_objectId: Buffer.from("2A8648CE3D0201", "hex")},
                curve: {_objectId: Buffer.from("2A8648CE3D030107", "hex")},
            },
            bytes: Buffer.from("00044BD687ABD29B59D8B12E8C6614BD1664ADB2D402455B6CA3EF4E581E3BE344B83212E614F27EA4EEC8F31C75747438739B1D451A7EAB3A30542A0A7D1882A459", "hex"),
        },
    },
    signAlgorithm: {_objectId: Buffer.from("2A8648CE3D040302", "hex")},
    signature: Buffer.from("00304602210080861AD536EFF01CAD42816A8172F71BE3E4FD7230CF73A45E34945FE89D5D7202210087FC1F47ADB6D150580706865E2E21E2963C9C15006B64DAB5658BFB980A2AD3", "hex"),
};

const ENCODED = Buffer.from("308200c5306e020100300e310c300a060355040a0c034353523059301306072a8648ce3d020106082a8648ce3d030107034200044bd687abd29b59d8b12e8c6614bd1664adb2d402455b6ca3ef4e581e3be344b83212e614f27ea4eec8f31c75747438739b1d451a7eab3a30542a0a7d1882a45906082a8648ce3d040302034900304602210080861ad536eff01cad42816a8172f71be3e4fd7230cf73a45e34945fe89d5d7202210087fc1f47adb6d150580706865e2e21e2963c9c15006b64dab5658bfb980a2ad3", "hex");

describe("DerCodec", () => {
    context("encode", () => {
        it("encodes a message", () => {
            const result = DerCodec.encode(DECODED);

            assert.equal(result.toString("hex"), ENCODED.toString("hex"));
        });
    });
});
