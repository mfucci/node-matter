/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from "../../codec/MessageCodec";
import { MessageExchange } from "./MessageExchange";

export interface Protocol<ContextT> {
    getId(): number;
    onNewExchange(exchange: MessageExchange<ContextT>, message: Message): void;
}
