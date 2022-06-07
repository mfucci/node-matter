/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { X509 } from "../../src/crypto/X509";

const PRIVATE_KEY = Buffer.from("727F1005CBA47ED7822A9D930943621617CFD3B79D9AF528B801ECF9F1992204", "hex");
const PUBLIC_KEY = Buffer.from("0462e2b6e1baff8d74a6fd8216c4cb67a3363a31e691492792e61aee610261481396725ef95e142686ba98f339b0ff65bc338bec7b9e8be0bdf3b2774982476220", "hex");

describe("X509", () => {

    context("createCertificateSigningRequest", () => {
        it("generates a valid CSR", () => {
            const result = X509.createCertificateSigningRequest({ publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY });

            // TODO: verify that the CSR is valid. The signature contains random, so it cannot be compared against a fixed byte array.
            console.log(result.toString("hex"));
        });
    });
});
