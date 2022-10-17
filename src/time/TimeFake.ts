/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

 import { Time, Timer } from "./Time";

 class TimerFake implements Timer {
    restart(): void {
       throw new Error("Method not implemented.");
    }
    cancel(): void {
       throw new Error("Method not implemented.");
    }

 }

 export class TimeFake extends Time {
    private timeMs: number = 0;

     now(): Date {
        return new Date(this.timeMs);
     }
 
     nowMs(): number {
        return this.timeMs;
     }

     getTimer(durationMs: number, callback: () => void): Timer {
        throw new Error("Method not implemented.");
     }
     
     getPeriodicTimer(intervalMs: number, callback: () => void): Timer {
        throw new Error("Method not implemented.");
     }

     setTime(timeMs: number) {
        this.timeMs = timeMs;
     }

     advanceTime(ms: number) {
        this.timeMs += ms;
     }
 }
 