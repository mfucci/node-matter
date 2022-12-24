/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from "../../../codec/MessageCodec";
import { ProtocolHandler } from "../../common/ProtocolHandler";
import { MessageExchange } from "../../common/MessageExchange";
import { CaseServer } from "./CaseServer";
import { PaseServer } from "./PaseServer";
import { MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { MatterDevice } from "../../MatterDevice";

export class SecureChannelProtocol implements ProtocolHandler<MatterDevice> {

    constructor(
        private readonly paseCommissioner: PaseServer,
        private readonly caseCommissioner: CaseServer,
    ) {}

    getId(): number {
        return SECURE_CHANNEL_PROTOCOL_ID;
    }

    async onNewExchange(exchange: MessageExchange<MatterDevice>, message: Message) {
        const messageType = message.payloadHeader.messageType;

        switch (messageType) {
            case MessageType.PbkdfParamRequest:
                await this.paseCommissioner.onNewExchange(exchange);
                break;
            case MessageType.Sigma1:
                await this.caseCommissioner.onNewExchange(exchange);
                break;
            default:
                throw new Error(`Unexpected initial message on secure channel protocol: ${messageType.toString(16)}`);
        }
    }
}
