/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Channel } from "../../net/Channel";
import { Fabric } from "../fabric/Fabric";
import { SecureSession } from "../session/SecureSession";
import { Session } from "../session/Session";
import { MessageChannel } from "./ExchangeManager";

export class ChannelManager {
    private readonly channels = new Map<string, MessageChannel<any>>();

    setChannel(fabric: Fabric, nodeId: bigint, channel: MessageChannel<any>) {
        this.channels.set(`${fabric.id}/${nodeId}`, channel);
    }

    getChannel(fabric: Fabric, nodeId: bigint) {
        const result = this.channels.get(`${fabric.id}/${nodeId}`);
        if (result === undefined) throw new Error(`Can't find find a channel to node ${nodeId}`);
        return result;
    }

    getOrCreateChannel(bufferChannel: Channel<Buffer>, session: Session<any>) {
        if (!session.isSecure()) return new MessageChannel(bufferChannel, session);
        const secureSession = session as SecureSession<any>;
        const fabric = secureSession.getFabric();
        const nodeId = secureSession.getPeerNodeId();
        if (fabric === undefined) return new MessageChannel(bufferChannel, session);

        let result = this.channels.get(`${fabric.id}/${nodeId}`);
        if (result === undefined || result.session.getId() !== session.getId()) {
            result = new MessageChannel(bufferChannel, session);
            this.setChannel(fabric, nodeId, result);
        }
        return result;
    }
}
