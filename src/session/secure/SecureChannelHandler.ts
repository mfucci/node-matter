/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MessageExchange, ProtocolHandler } from "../../server/MatterServer";
import { CasePairing } from "./CasePairing";
import { PasePairing } from "./PasePairing";
import { MessageType } from "./SecureChannelMessages";

export class SecureChannelHandler implements ProtocolHandler {

    constructor(
        private readonly paseCommissioner: PasePairing,
        private readonly caseCommissioner: CasePairing,
    ) {}

    onNewExchange(exchange: MessageExchange) {
        const messageType = exchange.getInitialMessageType();

        switch (messageType) {
            case MessageType.PbkdfParamRequest:
                return this.paseCommissioner.onNewExchange(exchange);
            case MessageType.Sigma1:
                return this.caseCommissioner.onNewExchange(exchange);
            default:
                throw new Error(`Unexpected initial message on secure channel protocol: ${messageType.toString(16)}`);
        }
    }
}
