import { MessageExchange } from "../transport/Dispatcher";
import { CaseCommissioner } from "./CaseCommissioner";
import { PaseCommissioner } from "./PaseCommissioner";
import { MessageType } from "./SecureChannelMessages";

export class SecureChannelDispatcher {

    constructor(
        private readonly paseCommissioner: PaseCommissioner,
        private readonly caseCommissioner: CaseCommissioner,
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