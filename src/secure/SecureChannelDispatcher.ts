import { MessageExchange } from "../transport/Dispatcher";
import { CasePairing } from "./CasePairing";
import { PasePairing } from "./PasePairing";
import { MessageType } from "./SecureChannelMessages";

export class SecureChannelDispatcher {

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