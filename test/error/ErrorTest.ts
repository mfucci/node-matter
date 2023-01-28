/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { MatterJsErrorCodes, MatterJsError, isMatterJsError } from "../../src/error/MatterJsError";

export function assertMatterJsError(e: unknown): asserts e is MatterJsError {
    if (!isMatterJsError(e)) {
        throw e;
    }
}

describe("Errors", () => {

    context("Test Errors", () => {
        it("error with code", () => {
            try {
                throw new MatterJsError("test", MatterJsErrorCodes.FabricNotFound);
            } catch (error) {
                assertMatterJsError(error);
                assert.equal(isMatterJsError(error), true);
                assert.equal(error.code, MatterJsErrorCodes.FabricNotFound);
                assert.equal(error.message, "(fabric-not-found): test");
            }
        });

        it("error with code and context", () => {
            try {
                throw new MatterJsError("test", MatterJsErrorCodes.FabricNotFound, "test-context");
            } catch (error) {
                assertMatterJsError(error);
                assert.equal(error.code, MatterJsErrorCodes.FabricNotFound);
                assert.equal(error.context, "test-context");
                assert.equal(error.message, "test-context (fabric-not-found): test");
            }
        });

        it("error with code and context and contextdata", () => {
            try {
                throw new MatterJsError("test", MatterJsErrorCodes.FabricNotFound, "test-context", { dataHere: "data" });
            } catch (error) {
                assertMatterJsError(error);
                assert.equal(error.code, MatterJsErrorCodes.FabricNotFound);
                assert.equal(error.context, "test-context");
                assert.equal(error.message, "test-context (fabric-not-found): test");
                assert.equal(error.contextData.dataHere, "data");
            }
        });
    });

});
