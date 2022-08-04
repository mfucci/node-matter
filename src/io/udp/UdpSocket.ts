/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from "dgram";
import { Queue } from "../../util/Queue";
import { Stream } from "../../util/Stream";

export class UdpSocket implements Stream<Buffer> {
    private readonly receivedMessages = new Queue<Buffer>();

    constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly id: string,
        private readonly peerAddress: string,
        private readonly peerPort: number,
        private readonly closeCallback: () => void
    ) { }

    onMessage(message: Buffer) {
        this.receivedMessages.write(message);
    }

    async read(): Promise<Buffer> {
        return this.receivedMessages.read();
    }

    async write(message: Buffer) {
        return new Promise<void>((resolve, reject) => {
            this.dgramSocket.send(message, this.peerPort, this.peerAddress, error => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    close() {
        this.closeCallback();
    }

    toString() {
        return `udp://${this.id}`;
    }
}
