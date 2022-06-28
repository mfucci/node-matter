import { MatterServer } from "./MatterServer";
import { MessageExchange } from "./MessageExchange";

export interface ProtocolHandlerBuilder {
    build(server: MatterServer): ProtocolHandler;
}

export interface ProtocolHandler {
    onNewExchange(exchange: MessageExchange): void;
}
