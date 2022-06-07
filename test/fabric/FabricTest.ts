/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { Crypto } from "../../src/crypto/Crypto";
import { Fabric, FabricBuilder } from "../../src/fabric/Fabric";

const ROOT_CERT = Buffer.from("153001010024020137032414001826048012542826058015203b37062414001824070124080130094104d89eb7e3f3226d0918f4b85832457bb9981bca7aaef58c18fb5ec07525e472b2bd1617fb75ee41bd388f94ae6a6070efc896777516a5c54aff74ec0804cdde9d370a3501290118240260300414e766069362d7e35b79687161644d222bdde93a68300514e766069362d7e35b79687161644d222bdde93a6818300b404e8fb06526f0332b3e928166864a6d29cade53fb5b8918a6d134d0994bf1ae6dce6762dcba99e80e96249d2f1ccedb336b26990f935dba5a0b9e5b4c9e5d1d8f1818181824ff0118", "hex");
const NEW_OP_CERT = Buffer.from("153001010124020137032414001826048012542826058015203b370624150124110918240701240801300941049ac1dc9995e6897f2bf1420a6efdba30781ac3dcdb7bb15e993050ff0ce92c52727b029c30f11f163b177d3bfa37f015db156994801f0e0f9b64c72bf8a15153370a35012801182402013603040204011830041402cce0d7bfa29e98e454be38e27bfe6c0f162302300514e766069362d7e35b79687161644d222bdde93a6818300b4050e8183c290f438a57516faea006282d6d2b5178d5d15dfcc3ec8a9232db942894ff2d2ce941d3b42dd8a2cd51eea4f3f50b66757959368868c3a0a1b5fe665f18", "hex");
const IPK_KEY = Buffer.from("74656d706f726172792069706b203031", "hex");
const OPERATIONAL_ID = Buffer.from("d559af361549a9a2", "hex");

const TEST_FABRIC_ID = BigInt("0x2906C908D115D362");
const TEST_NODE_ID = BigInt("0xCD5544AA7B13EF14");
const TEST_ROOT_PUBLIC_KEY = Buffer.from("044a9f42b1ca4840d37292bbc7f6a7e11e22200c976fc900dbc98a7a383a641cb8254a2e56d4e295a847943b4e3897c4a773e930277b4d9fbede8a052686bfacfa", "hex");
const TEST_IDENTITY_PROTECTION_KEY = Buffer.from("9bc61cd9c62a2df6d64dfcaa9dc472d4", "hex");
const TEST_RANDOM = Buffer.from("7e171231568dfa17206b3accf8faec2f4d21b580113196f47c7c4deb810a73dc", "hex");
const EXPECTED_DESTINATION_ID = Buffer.from("dc35dd5fc9134cc5544538c9c3fc4297c1ec3370c839136a80e10796451d4c53", "hex");

const TEST_RANDOM_2 = Buffer.from("147546b42b4212ae62e3b393b973e7892e02a86d387d8f4829b0861495b5743a", "hex");
const EXPECTED_DESTINATION_ID_2 = Buffer.from("e62053e0b5226773ab96833d79133c865ddb5a67c9ea932471c73405afcd68da", "hex");

const TEST_FABRIC_ID_3 = BigInt("0x0000000000000001");
const TEST_NODE_ID_3 = BigInt("0x0000000000000055");
const TEST_ROOT_PUBLIC_KEY_3 = Buffer.from("04d89eb7e3f3226d0918f4b85832457bb9981bca7aaef58c18fb5ec07525e472b2bd1617fb75ee41bd388f94ae6a6070efc896777516a5c54aff74ec0804cdde9d", "hex");
const TEST_IDENTITY_PROTECTION_KEY_3 = Buffer.from("0c677d9b5ac585827b577470bd9bd516", "hex");
const TEST_RANDOM_3 = Buffer.from("0b2a71876d3d090d37cb5286168ab9be0d2e7e0ccbedc1f55331b8a8051ee02f", "hex");
const EXPECTED_DESTINATION_ID_3 = Buffer.from("f7f7009606c61927af62502067581b4b0d27f2f22108e2c82c9f0ddd99ab3557", "hex");

describe("FabricBuilder", () => {
    context("build", () => {
        it("generates the correct compressed Fabric ID", async () => {
            const builder = new FabricBuilder();
            builder.setVendorId(0);
            builder.setRootCert(ROOT_CERT);
            builder.setNewOpCert(NEW_OP_CERT);
            builder.setIdentityProtectionKey(IPK_KEY);

            const result = (await builder.build()).operationalId;

            assert.equal(result.toString("hex"), OPERATIONAL_ID.toString("hex"));
        });

        it("generates the expected identityProtectionKey", async () => {
            const builder = new FabricBuilder();
            builder.setVendorId(0);
            builder.setRootCert(ROOT_CERT);
            builder.setNewOpCert(NEW_OP_CERT);
            builder.setIdentityProtectionKey(IPK_KEY);

            const result = (await builder.build()).identityProtectionKey;

            assert.equal(result.toString("hex"), TEST_IDENTITY_PROTECTION_KEY_3.toString("hex"));
        });
    });
});

describe("Fabric", () => {

    context("getDestinationId", () => {
        it("generates the correct destination ID", async () => {
            const fabric = new Fabric(TEST_FABRIC_ID, TEST_NODE_ID, Buffer.alloc(0), TEST_ROOT_PUBLIC_KEY, Crypto.createKeyPair(), 0, Buffer.alloc(0), TEST_IDENTITY_PROTECTION_KEY, undefined, Buffer.alloc(0)); 

            const result = fabric.getDestinationId(TEST_RANDOM);

            assert.equal(result.toString("hex"), EXPECTED_DESTINATION_ID.toString("hex"));
        });

        it("generates the correct destination ID 2", async () => {
            const builder = new FabricBuilder();
            builder.setVendorId(0);
            builder.setRootCert(ROOT_CERT);
            builder.setNewOpCert(NEW_OP_CERT);
            builder.setIdentityProtectionKey(IPK_KEY);
            const fabric = await builder.build();

            const result = fabric.getDestinationId(TEST_RANDOM_2);

            assert.equal(result.toString("hex"), EXPECTED_DESTINATION_ID_2.toString("hex"));
        });

        it("generates the correct destination ID 3", async () => {
            const fabric = new Fabric(TEST_FABRIC_ID_3, TEST_NODE_ID_3, Buffer.alloc(0), TEST_ROOT_PUBLIC_KEY_3, Crypto.createKeyPair(), 0, Buffer.alloc(0), TEST_IDENTITY_PROTECTION_KEY_3, undefined, Buffer.alloc(0)); 

            const result = fabric.getDestinationId(TEST_RANDOM_3);

            assert.equal(result.toString("hex"), EXPECTED_DESTINATION_ID_3.toString("hex"));
        });
    });
});
