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
        private paseCommissioner: ProtocolHandler<MatterDevice>,
        private readonly caseCommissioner: ProtocolHandler<MatterDevice>,
    ) {}

    getId(): number {
        return SECURE_CHANNEL_PROTOCOL_ID;
    }

    updatePaseCommissioner(paseServer: ProtocolHandler<MatterDevice>) {
        this.paseCommissioner = paseServer;
    }

    onNewExchange(exchange: MessageExchange<MatterDevice>, message: Message) {
        const messageType = message.payloadHeader.messageType;

        switch (messageType) {
            case MessageType.PbkdfParamRequest:
                this.paseCommissioner.onNewExchange(exchange, message);
                break;
            case MessageType.Sigma1:
                this.caseCommissioner.onNewExchange(exchange, message);
                break;
            default:
                throw new Error(`Unexpected initial message on secure channel protocol: ${messageType.toString(16)}`);
        }
    }
}
