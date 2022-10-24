/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Time, Timer } from "./Time";

class TimerFake implements Timer {
   constructor(
      private readonly timeFake: TimeFake,
      private readonly durationMs: number,
      private readonly callback: () => void,
   ) {}

   start() {
      this.timeFake.callbackAtTime(this.timeFake.nowMs() + this.durationMs, this.callback);
      return this;
   }

   stop() {
      this.timeFake.removeCallback(this.callback);
      return this;
   }
}

class IntervalFake extends TimerFake {
   constructor(timeFake: TimeFake, durationMs: number, callback: () => void) {
      const intervalCallback = () => {
         timeFake.callbackAtTime(timeFake.nowMs() + durationMs, intervalCallback);
         callback();
      };
      super(timeFake, durationMs, intervalCallback);
   }
}

export class TimeFake extends Time {
   private readonly callbacks = new Array<{atMs: number, callback: () => void}>();

   constructor(
      private timeMs: number,
   ) {
      super();
   }

   now(): Date {
      return new Date(this.timeMs);
   }

   nowMs(): number {
      return this.timeMs;
   }

   getTimer(durationMs: number, callback: () => void): Timer {
      return new TimerFake(this, durationMs, callback);
   }
   
   getPeriodicTimer(intervalMs: number, callback: () => void): Timer {
      return new IntervalFake(this, intervalMs, callback);
   }

   advanceTime(ms: number) {
      const newTimeMs = this.timeMs + ms;

      while (true) {
         if (this.callbacks.length === 0) break;
         const { atMs, callback } = this.callbacks[0];
         if (atMs > newTimeMs) break;
         this.callbacks.shift();
         this.timeMs = atMs;
         callback();
      }

      this.timeMs = newTimeMs;
   }

   callbackAtTime(atMs: number, callback: () => void) {
      if (atMs <= this.timeMs) {
         callback();
      } else {
         this.callbacks.push({atMs, callback});
         this.callbacks.sort(({atMs: atMsA}, {atMs: atMsB}) => atMsA - atMsB);
      }
   }

   removeCallback(callbackToRemove: () => void) {
      const index = this.callbacks.findIndex(({callback}) => callbackToRemove === callback);
      if (index === -1) return;
      this.callbacks.splice(index, 1);
   }
}
