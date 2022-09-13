import { Message } from "../../codec/MessageCodec";
import { MessageExchange } from "./MessageExchange";

export interface Protocol {
    getId(): number;
    onNewExchange(exchange: MessageExchange, message: Message): void;
}
