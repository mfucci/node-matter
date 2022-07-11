/**
 * Promise-based blocking queue.
 * 
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPromiseResolver } from "./Promises";
import { END_OF_STREAM, Stream } from "./Stream";

export class Queue<T> implements Stream<T> {
    private readonly queue = new Array<T>();
    private pendingRead?: { resolver: (data: T) => void, rejecter: (reason: any) => void};
    private closed = false;

    async read(): Promise<T> {
        const { promise, resolver, rejecter } = await getPromiseResolver<T>();
        if (this.closed) throw END_OF_STREAM;
        const data = this.queue.shift();
        if (data !== undefined) {
            return data;
        }
        this.pendingRead = { resolver, rejecter };
        return promise;
    }

    async write(data: T) {
        if (this.closed) throw END_OF_STREAM;
        if (this.pendingRead !== undefined) {
            this.pendingRead.resolver(data);
            this.pendingRead = undefined;
            return;
        }
        this.queue.push(data);
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        if (this.pendingRead === undefined) return;
        this.pendingRead.rejecter(END_OF_STREAM);
    }
}
