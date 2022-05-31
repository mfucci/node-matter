import { Crypto } from "../crypto/Crypto";
import { getSessionManager } from "../session/SessionManager";
import { PaseMessenger } from "./PaseMessenger";
import { ExchangeHandler, MessageExchange } from "../transport/Dispatcher";
import { PbkdfParameters, Spake2p } from "../crypto/Spake2p";

const DEFAULT_PASSCODE_ID = 0;
const SPAKE_CONTEXT = "CHIP PAKE V1 Commissioning";

export class PaseCommissioner implements ExchangeHandler {

    constructor(
        private readonly setupPinCode: number,
        private readonly pbkdfParameters: PbkdfParameters,
        ) {}

    async onNewExchange(exchange: MessageExchange) {
        const messenger = new PaseMessenger(exchange);
        try {
            await this.handlePairingRequest(messenger);
        } catch (error) {
            console.log("An error occured during the commissioning", error);
            await messenger.sendError();
        }
    }

    private async handlePairingRequest(messenger: PaseMessenger) {
        console.log("handlePbkdfParamRequest");
        const { requestPayload, request: { initiatorRandom, mrpParameters, passcodeId, hasPbkdfParameters, initiatorSessionId } } = await messenger.readPbkdfParamRequest();
        if (passcodeId !== DEFAULT_PASSCODE_ID) throw new Error(`Unsupported passcode ID ${passcodeId}`);

        const sessionManager = getSessionManager();
        const secureSessionId = sessionManager.getNextAvailableSessionId();

        // TODO: do something with mrpParameters

        const context = new Array<Buffer>();
        context.push(Buffer.from(SPAKE_CONTEXT));
        context.push(requestPayload);
        
        const responsePayload = await messenger.sendPbkdfParamResponse({
            initiatorRandom,
            responderRandom: Crypto.getRandomData(32),
            responderSessionId: secureSessionId,
            mrpParameters,
            pbkdfParameters: hasPbkdfParameters ? undefined : this.pbkdfParameters,
        });

        context.push(responsePayload);
        const spake2p = await Spake2p.create(Crypto.hash(context), this.pbkdfParameters, this.setupPinCode);

        const { x: X } = await messenger.readPasePake1();
        console.log("got pasePake1Message");

        const Y = spake2p.computeY();
        const { Ke, hAY, hBX } = await spake2p.computeSecretAndVerifiersFromX(X, Y);

        await messenger.sendPasePake2({ y: Y, verifier: hBX });
        const { verifier } = await messenger.readPasePake3();

        console.log("got pasePake3Message");

        if (!verifier.equals(hAY)) throw new Error("Received incorrect key confirmation from the initiator");
        console.log("All good!");

        await sessionManager.createSecureSession(secureSessionId, initiatorSessionId, Ke, Buffer.alloc(0), false);

        await messenger.sendSuccess();
    }
}
