/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Time } from "../time/Time";

export enum Level {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4,
}

function logFormater(now: Date, level: Level, logger: string, values: any[]) {
    const formattedNow = `${now.getFullYear()}-${now.getMonth()}-${now.getDay()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds().toString().padStart(3, "0")}`;
    const formattedValues = values.map(value => {
        if (Buffer.isBuffer(value)) {
            return value.toString("hex");
        }
        return value.toString()
    });
    return `${formattedNow} ${Level[level]} ${logger} ${formattedValues.join(" ")}`;
}

function consoleLogger(level: Level, formatedLog: string) {
    switch (level) {
        case Level.DEBUG: console.debug(formatedLog); break;
        case Level.INFO: console.info(formatedLog); break;
        case Level.WARN: console.warn(formatedLog); break;
        case Level.ERROR: console.error(formatedLog); break;
        case Level.FATAL: console.error(formatedLog); break;
    }
}

/**
 * Logger that can be used to emit traces.
 * 
 * Usage:
 * const logger = Logger.get("loggerName");
 * logger.debug("My debug message", "my extra value to log");
 * 
 * Configuration:
 * Logger.defaultLogLevel sets the default log level for all the logger
 * Logger.logLevels = { loggerName: Level.DEBUG } can set the level for the specific loggers
 */

export class Logger {
    static logFormater: (now: Date, level: Level, logger: string, ...values: any[]) => string = logFormater;
    static log: (level: Level, formatedLog: string) => void = consoleLogger;
    static defaultLogLevel = Level.DEBUG;
    static logLevels: { [logger: string]: Level } = {};

    static get(name: string) {
        return new Logger(name, this.logLevels[name] ?? this.defaultLogLevel);
    }

    private readonly time = Time.get();

    constructor(
        private readonly name: string,
        public minLevel: Level,
    ) {}

    debug = (...values: any[]) => this.log(Level.DEBUG, values);
    info = (...values: any[]) => this.log(Level.INFO, values);
    warn = (...values: any[]) => this.log(Level.WARN, values);
    error = (...values: any[]) => this.log(Level.ERROR, values);
    fatal = (...values: any[]) => this.log(Level.FATAL, values);

    private log(level: Level, values: any[]) {
        if (level < this.minLevel) return;
        Logger.log(level, Logger.logFormater(this.time.now(), level, this.name, values));
    }
}
