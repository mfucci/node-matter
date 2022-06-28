/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSessionManager } from "../session/SessionManager";
import { MessageExchange } from "./MessageExchange";
import { MessageCounter } from "./MessageCounter";
import { Channel } from "../channel/Channel";
import { ProtocolHandler, ProtocolHandlerBuilder } from "./ProtocolHandler";
import { END_OF_STREAM, Stream } from "../util/Stream";
import { SecureMessageStream } from "../session/SecureMessageStream";
import { Message } from "../codec/MessageCodec";
import { SecureMessage } from "../session/SecureMessage";

export const enum Protocol {
    SECURE_CHANNEL = 0x0000,
    INTERACTION_MODEL = 0x0001,
}

export class MatterServer {
    private readonly channels = new Array<Channel>();
    private readonly protocolHandlers = new Map<Protocol, ProtocolHandler>();

    private readonly messageCounter = new MessageCounter();
    private readonly exchanges = new Map<number, MessageExchange>();
    private readonly sessionManager = getSessionManager();

    addChannel(channel: Channel) {
        this.channels.push(channel);
        return this;
    }

    addProtocolHandler(protocol: Protocol, protocolHandlerBuilder: ProtocolHandlerBuilder) {
        this.protocolHandlers.set(protocol, protocolHandlerBuilder.build(this));
        return this;
    }

    start() {
        this.channels.forEach(channel => channel.bind(socket => this.onConnection(socket)));
    }

    getSessionManager() {
        return this.sessionManager;
    }

    private async onConnection(socket: Stream<Buffer>) {
        const messageStream = new SecureMessageStream(socket, this.sessionManager);
        
        try {
            while (true) {
                await this.handleMessage(messageStream);
            }
        } catch (error) {
            if (error === END_OF_STREAM) return;
            throw error;
        }
    }

    private async handleMessage(messageStream: Stream<SecureMessage>) {
        const secureMessage = await messageStream.read();
        const { message, session }  = secureMessage;
        const {message: {payloadHeader: {exchangeId, protocolId}}} = secureMessage;
        var exchange = this.exchanges.get(exchangeId);
        if (exchange === undefined) {
            // TODO: refactor this to handle mrp in a separate stream
            const mrpParameters = this.sessionManager.getSession(message.packetHeader.sessionId)?.getMrpParameters();
            if (mrpParameters === undefined) throw new Error("Cannot find the session");
            exchange = new MessageExchange({session, ...mrpParameters, ...message.packetHeader, ...message.payloadHeader}, messageStream, this.messageCounter, () => this.exchanges.delete(exchangeId));
            this.exchanges.set(exchangeId, exchange);
            const protocolHandler = this.protocolHandlers.get(protocolId);
            if (protocolHandler === undefined) throw new Error(`Unsupported protocol ${protocolId}`);
            protocolHandler.onNewExchange(exchange);
        }
        exchange.onMessageReceived(message);
    }
}
