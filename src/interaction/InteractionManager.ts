import { Device } from "../model/Device";
import { Session } from "../session/SessionManager";
import { ExchangeHandler, MessageExchange } from "../transport/Dispatcher";
import { InteractionMessenger, InvokeRequest, InvokeResponse, ReadRequest, ReadResponse } from "./InteractionMessenger";

export class InteractionManager implements ExchangeHandler {
    constructor(
        private readonly device: Device,
    ) {}

    async onNewExchange(exchange: MessageExchange) {
        const messenger = new InteractionMessenger(
            exchange,
            readRequest => this.handleReadRequest(readRequest),
            (session, invokeRequest) => this.handleInvokeRequest(session, invokeRequest),
        );
        await messenger.handleRequest();
    }

    handleReadRequest({attributes}: ReadRequest): ReadResponse {
        return {
            isFabricFiltered: true,
            interactionModelRevision: 1,
            values: attributes.flatMap(path => this.device.getAttributeValues(path)).map(value => ({value})),
        };
    }

    handleInvokeRequest(session: Session, {invokes}: InvokeRequest): InvokeResponse {
        return {
            suppressResponse: false,
            responses: invokes.flatMap(({path, args}) => this.device.invoke(session, path, args)).map(response => ({response})),
        };
    }
}
