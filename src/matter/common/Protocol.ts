import { Message } from "../../codec/MessageCodec";
import { MessageExchange } from "./MessageExchange";

export interface Protocol<ContextT> {
    getId(): number;
    onNewExchange(exchange: MessageExchange<ContextT>, message: Message): void;
}
