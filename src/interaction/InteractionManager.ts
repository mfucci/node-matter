import { ExchangeHandler, MessageExchange } from "../transport/Dispatcher";

export class InteractionManager implements ExchangeHandler {
    async onNewExchange(exchange: MessageExchange) {
        const message = await exchange.nextMessage();
        console.log(message);
    }
}
