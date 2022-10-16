/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

 import { Time } from "./Time";

 export class TimeFake extends Time {
    private timeMs: number = 0;

     now(): Date {
         return new Date(this.timeMs);
     }
 
     nowMs(): number {
         return this.timeMs;
     }

     setTime(timeMs: number) {
        this.timeMs = timeMs;
     }

     advanceTime(ms: number) {
        this.timeMs += ms;
     }
 }
 