import { Device } from "../model/Device";
import { ExchangeHandler, MessageExchange } from "../transport/Dispatcher";
import { InvokeRequest, InvokeResponse, ReadRequest, ReadResponse } from "./InteractionMessages";
import { InteractionMessenger } from "./InteractionMessenger";

export class InteractionManager implements ExchangeHandler {
    constructor(
        private readonly device: Device,
    ) {}

    async onNewExchange(exchange: MessageExchange) {
        const messenger = new InteractionMessenger(
            exchange,
            readRequest => this.handleReadRequest(readRequest),
            invokeRequest => this.handleInvokeRequest(invokeRequest),
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

    handleInvokeRequest({invokes}: InvokeRequest): InvokeResponse {
        return {
            suppressResponse: false,
            responses: invokes.flatMap(({path, args}) => this.device.invoke(path, args)).map(response => ({response})),
        };
    }
}
