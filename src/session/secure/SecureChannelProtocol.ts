/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from "../../codec/MessageCodec";
import { Protocol } from "../../matter/common/Protocol";
import { MessageExchange } from "../../matter/common/MessageExchange";
import { CasePairing } from "./CasePairing";
import { PasePairing } from "./PasePairing";
import { MessageType, SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";

export class SecureChannelProtocol implements Protocol {

    constructor(
        private readonly paseCommissioner: PasePairing,
        private readonly caseCommissioner: CasePairing,
    ) {}

    getId(): number {
        return SECURE_CHANNEL_PROTOCOL_ID;
    }

    onNewExchange(exchange: MessageExchange, message: Message) {
        const messageType = message.payloadHeader.messageType;

        switch (messageType) {
            case MessageType.PbkdfParamRequest:
                this.paseCommissioner.onNewExchange(exchange);
                break;
            case MessageType.Sigma1:
                this.caseCommissioner.onNewExchange(exchange);
                break;
            default:
                throw new Error(`Unexpected initial message on secure channel protocol: ${messageType.toString(16)}`);
        }
    }
}
