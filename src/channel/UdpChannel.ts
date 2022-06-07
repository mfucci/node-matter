/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import dgram from 'node:dgram';
import { Channel, ExchangeSocket } from '../server/MatterServer';

export class UdpChannel implements Channel {
    private readonly server = dgram.createSocket('udp4');

    constructor(
        private readonly port: number = 5540,
        ) {
        this.server.on('error', error => console.log(`server error:${error.stack}`));
    }

    bind(listener: (socket: ExchangeSocket<Buffer>, messageBytes: Buffer) => void) {
        this.server.on('message', (message, {address, port}) => listener(new UdpSocket(this.server, address, port), message));
        this.server.bind(this.port);
        console.log("Matter server listening");
    }
}

class UdpSocket implements ExchangeSocket<Buffer> {
    constructor(
        private readonly server: dgram.Socket,
        private readonly peerIp: string,
        private readonly peerPort: number,
    ) {}


    send(data: Buffer) {
        return new Promise<void>((resolver, rejecter) => {
            this.server.send(data, this.peerPort, this.peerIp, error => {
                if (error !== null) rejecter(error);
                resolver();
            });
        });
    }

    getName() {
        return `udp://${this.peerIp}:${this.peerPort}`;
    }
}
