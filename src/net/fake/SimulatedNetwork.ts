/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "../NetInterface";
import { singleton } from "../../util/Singleton";

export type Listener = (peerAddress: string, peerPort: number, data: Buffer) => void;

export class SimulatedNetwork {
    static get = singleton(() => new SimulatedNetwork());

    private readonly listenersMap = new Map<string, Array<Listener>>();

    onUdpData(address: string, port: number, listener: Listener): NetListener {
        const ipPort = `${address}:${port}`;
        var listeners = this.listenersMap.get(ipPort);
        if (listeners === undefined) {
            listeners = new Array<Listener>();
            this.listenersMap.set(ipPort, listeners);
        }
        listeners.push(listener);
        return {
            close: () => this.offUdpData(address, port, listener),
        }
    }

    private offUdpData(address: string, port: number, listenerToRemove: Listener) {
        const ipPort = `${address}:${port}`;
        var listeners = this.listenersMap.get(ipPort);
        if (listeners === undefined) return;
        const newListeners = listeners.filter(listener => listener !== listenerToRemove);
        if (newListeners.length === 0) {
            this.listenersMap.delete(ipPort);
            return;
        }
        this.listenersMap.set(ipPort, newListeners);
    }

    async sendUdp(localAddress: string, localPort: number, remoteAddress: string, remotePort: number, data: Buffer) {
        const ipPort = `${remoteAddress}:${remotePort}`;
        this.listenersMap.get(ipPort)?.forEach(listener => {
            try {
                listener(localAddress, localPort, data);
            } catch (error) {
                console.error(error);
            }
        });
    }
}
