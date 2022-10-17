/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../../../crypto/Crypto";
import { Spake2p } from "../../../crypto/Spake2p";
import { Logger } from "../../../log/Logger";
import { MessageExchange } from "../../common/MessageExchange";
import { MatterController } from "../../MatterController";
import { UNDEFINED_NODE_ID } from "../SessionManager";
import { DEFAULT_PASSCODE_ID, PaseClientMessenger, SPAKE_CONTEXT } from "./PaseMessenger";

const logger = Logger.get("PaseClient");

export class PaseClient {
    constructor() {}

    async pair(client: MatterController, exchange: MessageExchange<MatterController>, setupPin: number) {
        const messenger = new PaseClientMessenger(exchange);
        const random = Crypto.getRandom();
        const sessionId = client.getNextAvailableSessionId();

        // Send pbkdRequest and Read pbkdResponse
        const requestPayload = await messenger.sendPbkdfParamRequest({ random, sessionId, passcodeId: DEFAULT_PASSCODE_ID, hasPbkdfParameters: false });
        const { responsePayload, response: { pbkdfParameters, sessionId: peerSessionId } } = await messenger.readPbkdfParamResponse();
        if (pbkdfParameters === undefined) throw new Error("Missing requested PbkdfParameters in the response");

        // Compute pake1 and read pake2
        const spake2p = await Spake2p.create(Crypto.hash([ SPAKE_CONTEXT, requestPayload, responsePayload ]), pbkdfParameters, setupPin);
        const X = spake2p.computeX();
        await messenger.sendPasePake1({x: X});

        // Process pack2 and send pake3
        const { y: Y, verifier } = await messenger.readPasePake2();
        const { Ke, hAY, hBX } = await spake2p.computeSecretAndVerifiersFromY(X, Y);
        if (!verifier.equals(hBX)) throw new Error("Received incorrect key confirmation from the receiver");
        await messenger.sendPasePake3({ verifier: hAY });

        // All good! Creating the secure session
        await messenger.waitForSuccess();
        const secureSession = await client.createSecureSession(sessionId, UNDEFINED_NODE_ID, UNDEFINED_NODE_ID, peerSessionId, Ke, Buffer.alloc(0), true, false);
        messenger.close();
        logger.info(`Pase client: Paired succesfully with ${messenger.getChannelName()}`);

        return secureSession;
    }
}
