/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { BN } from "bn.js";
import { Spake2p2 } from "../../src/crypto/Spake2p2";

describe("Spake2p2", () => {
    context("https://datatracker.ietf.org/doc/html/draft-bar-cfrg-spake2plus-01 test vectors", () => {
        const context = Buffer.from("f1430aa82464b2794a9bc07285b7975718a63170819e63e0e312143ef276554d", "hex");
        const w0 = new BN("452ea9c6d5fd01c822a756be008357e76c72a6012317dff238cbd9436711b0b2", "hex");

        const L = Buffer.from("043470b28767ea0220e8940a727eeda804dd06c5a7f06efef9dcbce89582f13c6e4cd353058f64dc55dab6a8093bd4fb25ed1c7afe807ec68d0c79e740276290bc", "hex");
        
        const y = new BN("2E8AB4CEC824C1F5898616479BD1D6E4E6A206BE7AA1BB93FA50868CDD042093", "hex");

        const X = Buffer.from("040f16c3a1d2fd66048db0ed39a09bc4285269b4e5c493c737a46adfabb0976a8eb585a4f6bdaf4b624bfa50c5d94806d68de6a106d36090f4680ab43390800c31", "hex");
        const Y = Buffer.from("048cf7ba90e51bb4956896812019dab81685482584866afb9fd53e508bbf28fcf3b4a90de937e663792e9215135f4c0b756651205a5c7b08564275946421e2b3cb", "hex");
        
        //const Ke = Buffer.from("ea3276d68334576097e04b19ee5a3a8b", "hex");
        //const hAY = Buffer.from("71d9412779b6c45a2c615c9df3f1fd93dc0aaf63104da8ece4aa1b5a3a415fea", "hex");
        const hBX = Buffer.from("3e4732bf2d7018d7c67a0593326792b59928d89ccbb752352283bddbeaa11218", "hex");
        const spake2pReceiver = new Spake2p2(context, y, w0, L);


        it("generates Y", () => {
            const result = spake2pReceiver.computeY();

            assert.deepEqual(result, Y);
        });

        it("generates shared secret and key confirmation for the receiver", async () => {
            const result = await spake2pReceiver.computeSecretAndVerifiersFromX(X, Y);

            assert.deepEqual(result.hBX, hBX);
        });
    });
});
