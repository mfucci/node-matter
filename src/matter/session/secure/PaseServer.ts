/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto } from "../../../crypto/Crypto";
import { UNDEFINED_NODE_ID } from "../SessionManager";
import { DEFAULT_PASSCODE_ID, PaseServerMessenger, SPAKE_CONTEXT } from "./PaseMessenger";
import { ProtocolHandler } from "../../common/ProtocolHandler";
import { MessageExchange } from "../../common/MessageExchange";
import { PbkdfParameters, Spake2p } from "../../../crypto/Spake2p";
import { SECURE_CHANNEL_PROTOCOL_ID } from "./SecureChannelMessages";
import { MatterDevice } from "../../MatterDevice";

export class PaseServer implements ProtocolHandler<MatterDevice> {

    constructor(
        private readonly setupPinCode: number,
        private readonly pbkdfParameters: PbkdfParameters,
        ) {}

    getId(): number {
        return SECURE_CHANNEL_PROTOCOL_ID;
    }

    async onNewExchange(exchange: MessageExchange<MatterDevice>) {
        const messenger = new PaseServerMessenger(exchange);
        try {
            await this.handlePairingRequest(exchange.session.getContext(), messenger);
        } catch (error) {
            console.log("An error occured during the commissioning", error);
            await messenger.sendError();
        }
    }

    private async handlePairingRequest(server: MatterDevice, messenger: PaseServerMessenger) {
        console.log(`Pase server: Received pairing request from ${messenger.getChannelName()}`);
        const sessionId = server.getNextAvailableSessionId();
        const random = Crypto.getRandom();

        // Read pbkdRequest and send pbkdResponse
        const { requestPayload, request: { random: peerRandom, mrpParameters, passcodeId, hasPbkdfParameters, sessionId: peerSessionId } } = await messenger.readPbkdfParamRequest();
        if (passcodeId !== DEFAULT_PASSCODE_ID) throw new Error(`Unsupported passcode ID ${passcodeId}`);
        const responsePayload = await messenger.sendPbkdfParamResponse({ peerRandom, random, sessionId, mrpParameters, pbkdfParameters: hasPbkdfParameters ? undefined : this.pbkdfParameters });

        // Process pake1 and send pake2
        const spake2p = await Spake2p.create(Crypto.hash([ SPAKE_CONTEXT, requestPayload, responsePayload ]), this.pbkdfParameters, this.setupPinCode);
        const { x: X } = await messenger.readPasePake1();
        const Y = spake2p.computeY();
        const { Ke, hAY, hBX } = await spake2p.computeSecretAndVerifiersFromX(X, Y);
        await messenger.sendPasePake2({ y: Y, verifier: hBX });

        // Read and process pake3
        const { verifier } = await messenger.readPasePake3();
        if (!verifier.equals(hAY)) throw new Error("Received incorrect key confirmation from the initiator");

        // All good! Creating the secure session
        await server.createSecureSession(sessionId, undefined /* fabric */, UNDEFINED_NODE_ID, peerSessionId, Ke, Buffer.alloc(0), false, false, mrpParameters?.idleRetransTimeoutMs, mrpParameters?.activeRetransTimeoutMs);
        await messenger.sendSuccess();
        messenger.close();
        console.log(`Pase server: session ${sessionId} created with ${messenger.getChannelName()}`);
    }
}
