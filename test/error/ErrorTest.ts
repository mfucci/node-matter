/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import {
    tryCatch,
    MatterError,
    StatusResponseError,
    FailureStatusResponseError,
    tryCatchAsync
} from "../../src/error/MatterError";
import { StatusCode } from "../../src/matter/interaction/InteractionMessages";

class SubMatterError extends MatterError {}
class SubSubMatterError extends SubMatterError {}
class OtherMatterError extends MatterError {}

describe("Errors", () => {

    context("Test tryCatch method", () => {
        it("tryCatch without error return value", () => {
            const error = tryCatch(() => {
                return "ok";
            },
            MatterError, "caught");

            assert.equal(error, "ok");
        });

        it("tryCatch with expected error, uses fallback value", () => {
            const error = tryCatch(() => {
                throw new SubMatterError("test");
            },
            SubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with unexpected error, throw error", () => {
            try {
                const error = tryCatch(() => {
                    throw new Error("test");
                },
                SubMatterError, "caught");
            } catch (e: any) {
                assert.equal(e instanceof Error, true);
                assert.equal(e.message, "test");
                return;
            }
            assert(false);
        });

        it("tryCatch with inherited error returns fallbackvalue", () => {
            const error = tryCatch(() => {
                throw new SubSubMatterError("test");
            },
            SubSubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error also return fallback when checking for parent error", () => {
            const error = tryCatch(() => {
                throw new SubSubMatterError("test");
            },
            SubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error process error in handler function return dynamic fallback value", () => {
            const error = tryCatch(() => {
                throw new SubSubMatterError("test");
            },
            SubMatterError, (error) => {
                if (error instanceof SubSubMatterError) {
                    return "caught";
                }
            });

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error process error in handler function that not return fallback value throws the error", () => {
            try {
                const error = tryCatch(() => {
                    throw new SubSubMatterError("test");
                },
                SubMatterError, (error) => {
                    if (error instanceof OtherMatterError) {
                        return "caught";
                    }
                });
            } catch (e: any) {
                assert.equal(e instanceof SubSubMatterError, true);
                assert.equal(e.message, "test");
                return;
            }
            assert(false);
        });
    });

    context("Test tryCatchAsync method", () => {

        it("tryCatch without error return value", async () => {
            const error = await tryCatchAsync(async () => {
                return "ok";
            },
            MatterError, "caught");

            assert.equal(error, "ok");
        });

        it("tryCatch with expected error, uses fallback value", async () => {
            const error = await tryCatchAsync(async () => {
                throw new SubMatterError("test");
            },
            SubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with unexpected error, throw error", async () => {
            try {
                const error = await tryCatchAsync(async () => {
                    throw new Error("test");
                },
                SubMatterError, "caught");
            } catch (e: any) {
                assert.equal(e instanceof Error, true);
                assert.equal(e.message, "test");
                return;
            }
            assert(false);
        });

        it("tryCatch with inherited error returns fallbackvalue", async () => {
            const error = await tryCatchAsync(() => {
                throw new SubSubMatterError("test");
            },
            SubSubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error also return fallback when checking for parent error", async () => {
            const error = await tryCatchAsync(async () => {
                throw new SubSubMatterError("test");
            },
            SubMatterError, "caught");

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error process error in handler function return dynamic fallback value", async () => {
            const error = await tryCatchAsync(async () => {
                throw new SubSubMatterError("test");
            },
            SubMatterError, (error) => {
                if (error instanceof SubSubMatterError) {
                    return "caught";
                }
            });

            assert.equal(error, "caught");
        });

        it("tryCatch with inherited error process error in handler function that not return fallback value throws the error", async () => {
            try {
                const error = await tryCatchAsync(() => {
                    throw new SubSubMatterError("test");
                },
                SubMatterError, (error) => {
                    if (error instanceof OtherMatterError) {
                        return "caught";
                    }
                });
            } catch (e: any) {
                assert.equal(e instanceof SubSubMatterError, true);
                assert.equal(e.message, "test");
                return;
            }
            assert(false);
        });
    });

    context("Test dynamic created errors", () => {
        it("get an Error for a certain StatusCode", () => {
            const error = new (StatusResponseError.getErrorClass(StatusCode.Failure))("test");
            assert.equal(error instanceof StatusResponseError, true);
            assert.equal(error instanceof FailureStatusResponseError, true);
        });
    });
});
