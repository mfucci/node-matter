/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { NetListener } from "../NetInterface";
import { singleton } from "../../util/Singleton";
import { Logger } from "../../log/Logger";
import { ByteArray } from "@project-chip/matter.js";

export type Listener = (netInterface: string, peerAddress: string, peerPort: number, data: ByteArray) => void;

const logger = Logger.get("SimulatedNetwork");

export const FAKE_INTERFACE_NAME = "fakeInterface";

export class SimulatedNetwork {
    static get = singleton(() => new SimulatedNetwork());

    private readonly listenersMap = new Map<string, Array<Listener>>();

    onUdpData(address: string | undefined, port: number, listener: Listener): NetListener {
        const ipPort = `${address ?? "*"}:${port}`;
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

    private offUdpData(address: string | undefined, port: number, listenerToRemove: Listener) {
        const ipPort = `${address ?? "*"}:${port}`;
        var listeners = this.listenersMap.get(ipPort);
        if (listeners === undefined) return;
        const newListeners = listeners.filter(listener => listener !== listenerToRemove);
        if (newListeners.length === 0) {
            this.listenersMap.delete(ipPort);
            return;
        }
        this.listenersMap.set(ipPort, newListeners);
    }

    async sendUdp(localAddress: string, localPort: number, remoteAddress: string, remotePort: number, data: ByteArray) {
        [`${remoteAddress}:${remotePort}` , `*:${remotePort}`].forEach(ipPort => this.listenersMap.get(ipPort)?.forEach(listener => {
            try {
                listener(FAKE_INTERFACE_NAME, localAddress, localPort, data);
            } catch (error) {
                logger.error(error);
            }
        }));
    }
}
