/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { Level, Logger } from "../../src/log/Logger";
import { Time } from "../../src/time/Time";
import { TimeFake } from "../../src/time/TimeFake";

const fakeTime = new TimeFake();
const fakeLogSink = new Array<{level: Level, log: string}>();
const defaultFormatter = Logger.logFormater;
Time.get = () => fakeTime;

fakeTime.setTime(1262679233478);
Logger.defaultLogLevel = Level.DEBUG;
Logger.log = (level, log) => fakeLogSink.push({ level, log });

describe("Logger", () => {
    const logger = Logger.get("UnitTest");

    beforeEach(() => {
        Logger.logFormater = defaultFormatter;
        Logger.logLevels = {};
        Logger.defaultLogLevel = Level.DEBUG;
        logger.minLevel = Level.DEBUG;
    });

    afterEach(() => {
        fakeLogSink.length = 0;
    });

    context("debug", () => {
        it("logs a message if level is debug", () => {
            logger.debug("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.level, Level.DEBUG);
        });

        it("doesn't log a message if level is above debug", () => {
            logger.minLevel = Level.INFO;

            logger.debug("test");
            const result = fakeLogSink.pop();

            assert.equal(result, undefined);
        });
    });

    context("info", () => {
        it("logs a message if level is info", () => {
            logger.info("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.level, Level.INFO);
        });

        it("doesn't log a message if level is above info", () => {
            logger.minLevel = Level.ERROR;

            logger.info("test");
            const result = fakeLogSink.pop();

            assert.equal(result, undefined);
        });
    });

    context("warn", () => {
        it("logs a message if level is warn", () => {
            logger.warn("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.level, Level.WARN);
        });

        it("doesn't log a message if level is above warn", () => {
            logger.minLevel = Level.ERROR;

            logger.warn("test");
            const result = fakeLogSink.pop();

            assert.equal(result, undefined);
        });
    });

    context("error", () => {
        it("logs a message if level is error", () => {
            logger.error("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.level, Level.ERROR);
        });

        it("doesn't log a message if level is above error", () => {
            logger.minLevel = Level.FATAL;

            logger.error("test");
            const result = fakeLogSink.pop();

            assert.equal(result, undefined);
        });
    });

    context("fatal", () => {
        it("logs a message", () => {
            logger.fatal("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.level, Level.FATAL);
        });
    });

    context("logFormat", () => {
        it("formats correctly the log", () => {
            logger.debug("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.log, "2010-0-2 9:13:53.478 DEBUG UnitTest test");
        });

        it("accepts multiple values", () => {
            logger.debug("value1", "value2");
            const result = fakeLogSink.pop();

            assert.equal(result?.log, "2010-0-2 9:13:53.478 DEBUG UnitTest value1 value2");
        });

        it("converts Buffer to hex strings", () => {
            logger.debug(Buffer.from("00deadbeef", "hex"));
            const result = fakeLogSink.pop();

            assert.equal(result?.log, "2010-0-2 9:13:53.478 DEBUG UnitTest 00deadbeef");
        });

        it("accepts custom formatters", () => {
            Logger.logFormater = (now, level, logger, values) => values[0].toString();

            logger.debug("test");
            const result = fakeLogSink.pop();

            assert.equal(result?.log, "test");
        });
    });

    context("log level", () => {
        it("uses the default log level by default", () => {
            Logger.defaultLogLevel = Level.ERROR;

            const logger = Logger.get("test");

            assert.equal(logger.minLevel, Level.ERROR);
        });

        it("uses the configured log level for the logger", () => {
            Logger.logLevels = {
                test: Level.INFO,
            };

            const logger = Logger.get("test");

            assert.equal(logger.minLevel, Level.INFO);
        });
    });
});
