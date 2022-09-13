import { SessionManager } from "../session/SessionManager";
import { MessageExchange } from "./common/MessageExchange";
import { NetInterface } from "./common/NetInterface";

export class MatterClient {
    private readonly sessionManager = new SessionManager(this);

    constructor(
        private readonly netInterface: NetInterface,
    ) {}

    async commission(address: string, discriminator: number) {
        //const exchange: MessageExchange = MessageExchange.initiate(SessionManager.)

        throw new Error("Not yet implemented");
    }
}