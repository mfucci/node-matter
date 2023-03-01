/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, MessageCodec, Packet } from "../../codec/MessageCodec";
import { Crypto } from "../../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { SubscriptionHandler } from "../interaction/SubscriptionHandler";
import {
    DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS,
    DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS,
    DEFAULT_RETRANSMISSION_RETRIES,
    SLEEPY_ACTIVE_THRESHOLD_MS,
    Session,
} from "./Session";
import { UNDEFINED_NODE_ID } from "./SessionManager";
import { NodeId } from "../common/NodeId";
import { ByteArray, DataWriter, Endian } from "@project-chip/matter.js";
import { Time } from "../../time/Time";
import { Logger } from "../../log/Logger";

const logger = Logger.get("SecureSession");

const SESSION_KEYS_INFO = ByteArray.fromString("SessionKeys");
const SESSION_RESUMPTION_KEYS_INFO = ByteArray.fromString("SessionResumptionKeys");

export class SecureSession<T> implements Session<T> {
    private nextSubscriptionId = 0;
    private readonly subscriptions = new Array<SubscriptionHandler>();
    private timestamp = Time.nowMs();
    private activeTimestamp = this.timestamp;

    static async create<T>(context: T, id: number, fabric: Fabric | undefined, peerNodeId: NodeId, peerSessionId: number, sharedSecret: ByteArray, salt: ByteArray, isInitiator: boolean, isResumption: boolean, closeCallback: () => void, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        const keys = await Crypto.hkdf(sharedSecret, salt, isResumption ? SESSION_RESUMPTION_KEYS_INFO : SESSION_KEYS_INFO, 16 * 3);
        const decryptKey = isInitiator ? keys.slice(16, 32) : keys.slice(0, 16);
        const encryptKey = isInitiator ? keys.slice(0, 16) : keys.slice(16, 32);
        const attestationKey = keys.slice(32, 48);
        const session = new SecureSession(context, id, fabric, peerNodeId, peerSessionId, sharedSecret, decryptKey, encryptKey, attestationKey, closeCallback, idleRetransTimeoutMs, activeRetransTimeoutMs);
        fabric?.addSession(session);
        return session;
    }

    constructor(
        private readonly context: T,
        private readonly id: number,
        private readonly fabric: Fabric | undefined,
        private readonly peerNodeId: NodeId,
        private readonly peerSessionId: number,
        private readonly sharedSecret: ByteArray,
        private readonly decryptKey: ByteArray,
        private readonly encryptKey: ByteArray,
        private readonly attestationKey: ByteArray,
        private readonly closeCallback: () => void,
        private readonly idleRetransmissionTimeoutMs: number = DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS,
        private readonly activeRetransmissionTimeoutMs: number = DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS,
        private readonly retransmissionRetries: number = DEFAULT_RETRANSMISSION_RETRIES,
    ) {}

    isSecure(): boolean {
        return true;
    }

    notifyActivity(messageReceived: boolean) {
        this.timestamp = Time.nowMs();
        if (messageReceived) { // only update active timestamp if we received a message
            this.activeTimestamp = this.timestamp;
        }
    }

    isPeerActive(): boolean {
        return (Time.nowMs() - this.activeTimestamp) < SLEEPY_ACTIVE_THRESHOLD_MS;
    }

    decode({ header, bytes }: Packet): Message {
        const headerBytes = MessageCodec.encodePacketHeader(header);
        const securityFlags = headerBytes[3];
        const nonce = this.generateNonce(securityFlags, header.messageId, this.peerNodeId);
        return MessageCodec.decodePayload({ header, bytes: Crypto.decrypt(this.decryptKey, bytes, nonce, headerBytes) });
    }

    encode(message: Message): Packet {
        message.packetHeader.sessionId = this.peerSessionId;
        const {header, bytes} = MessageCodec.encodePayload(message);
        const headerBytes = MessageCodec.encodePacketHeader(message.packetHeader);
        const securityFlags = headerBytes[3];
        const nonce = this.generateNonce(securityFlags, header.messageId, this.fabric?.nodeId ?? UNDEFINED_NODE_ID);
        return { header, bytes: Crypto.encrypt(this.encryptKey, bytes, nonce, headerBytes)};
    }

    getAttestationChallengeKey(): ByteArray {
        return this.attestationKey;
    }

    getFabric() {
        return this.fabric;
    }

    getName() {
        return `secure/${this.id}`;
    }

    getMrpParameters() {
        const {idleRetransmissionTimeoutMs, activeRetransmissionTimeoutMs, retransmissionRetries} = this;
        return {idleRetransmissionTimeoutMs, activeRetransmissionTimeoutMs, retransmissionRetries};
    }

    getContext() {
        return this.context;
    }

    getId() {
        return this.id;
    }

    getPeerSessionId(): number {
        return this.peerSessionId;
    }

    getNodeId() {
        return this.fabric?.nodeId ?? UNDEFINED_NODE_ID;
    }

    getPeerNodeId() {
        return this.peerNodeId;
    }

    addSubscription(subscription: SubscriptionHandler) {
        this.subscriptions.push(subscription);
        logger.debug(`Added subscription ${subscription.subscriptionId} to ${this.getName()}/${this.id}`);
    }

    destroy() {
        this.clearSubscriptions();
    }

    clearSubscriptions() {
        this.subscriptions.forEach(subscription => subscription.cancel());
        this.subscriptions.length = 0;
    }

    destroy() {
        this.clearSubscriptions();
        this.closeCallback();
    }

    private generateNonce(securityFlags: number, messageId: number, nodeId: NodeId) {
        const writer = new DataWriter(Endian.Little);
        writer.writeUInt8(securityFlags);
        writer.writeUInt32(messageId);
        writer.writeUInt64(nodeId.id);
        return writer.toByteArray();
    }
}
