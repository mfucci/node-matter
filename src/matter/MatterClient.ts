import { SECURE_CHANNEL_PROTOCOL_ID } from "../session/secure/SecureChannelMessages";
import { SessionManager } from "../session/SessionManager";
import { NetInterface } from "../net/NetInterface";
import { ExchangeManager } from "./common/ExchangeManager";
import { PaseClient } from "../session/secure/PaseClient";

export class MatterClient {
    private readonly sessionManager = new SessionManager(this);
    private readonly exchangeManager = new ExchangeManager<MatterClient>(this.sessionManager);
    private readonly paseClient = new PaseClient();

    constructor(
        private readonly netInterface: NetInterface,
    ) {
        this.exchangeManager.addNetInterface(netInterface);
    }

    async commission(address: string, port: number, discriminator: number, setupPin: number) {
        const channel = await this.netInterface.openChannel(address, port);
        const exchange = this.exchangeManager.initiateExchange(this.sessionManager.getUnsecureSession(), channel, SECURE_CHANNEL_PROTOCOL_ID);

        await this.paseClient.pair(this, exchange, setupPin);
        //throw new Error("Not yet implemented");
    }

    getNextAvailableSessionId() {
        return this.sessionManager.getNextAvailableSessionId();
    }

    createSecureSession(sessionId: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        return this.sessionManager.createSecureSession(sessionId, nodeId, peerNodeId, peerSessionId, sharedSecret, salt, isInitiator, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }
}
