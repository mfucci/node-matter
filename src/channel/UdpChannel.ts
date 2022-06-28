/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "./Channel";
import { Stream } from '../util/Stream';
import { UdpServerSocket } from '../util/Udp';

export class UdpChannel implements Channel {
    private server?: UdpServerSocket;

    constructor(
        private readonly port: number = 5540,
    ) {}

    async bind(listener: (socket: Stream<Buffer>) => void) {
        this.server = await UdpServerSocket.create(this.port, socket => listener(socket));
        console.log("Matter server listening");
    }
}
