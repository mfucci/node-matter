/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, MessageCodec, Packet } from "../codec/MessageCodec";
import { Crypto } from "../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { SubscriptionHandler } from "../interaction/InteractionProtocol";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS, DEFAULT_RETRANSMISSION_RETRIES, Session } from "./Session";

const SESSION_KEYS_INFO = Buffer.from("SessionKeys");

export class SecureSession<T> implements Session<T> {
    private fabric?: Fabric;
    private nextSubscriptionId = 0;
    private readonly subscriptions = new Array<SubscriptionHandler>();

    static async create<T>(context: T, id: number, nodeId: bigint, peerNodeId: bigint, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean, idleRetransTimeoutMs?: number, activeRetransTimeoutMs?: number) {
        const keys = await Crypto.hkdf(sharedSecret, salt, SESSION_KEYS_INFO, 16 * 3);
        const decryptKey = isInitiator ? keys.slice(16, 32) : keys.slice(0, 16);
        const encryptKey = isInitiator ? keys.slice(0, 16) : keys.slice(16, 32);
        const attestationKey = keys.slice(32, 48);
        return new SecureSession(context, id, nodeId, peerNodeId, peerSessionId, sharedSecret, decryptKey, encryptKey, attestationKey, idleRetransTimeoutMs, activeRetransTimeoutMs);
    }

    constructor(
        private readonly context: T,
        private readonly id: number,
        private readonly nodeId: bigint,
        private readonly peerNodeId: bigint,
        private readonly peerSessionId: number,
        private readonly sharedSecret: Buffer,
        private readonly decryptKey: Buffer,
        private readonly encryptKey: Buffer,
        private readonly attestationKey: Buffer,
        private readonly idleRetransmissionTimeoutMs: number = DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS,
        private readonly activeRetransmissionTimeoutMs: number = DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS,
        private readonly retransmissionRetries: number = DEFAULT_RETRANSMISSION_RETRIES,
    ) {}

    isSecure(): boolean {
        return true;
    }

    decode({ header, bytes }: Packet): Message {
        const headerBytes = MessageCodec.encodePacketHeader(header);
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, this.peerNodeId);
        return MessageCodec.decodePayload({ header, bytes: Crypto.decrypt(this.decryptKey, bytes, nonce, headerBytes) });
    }
    
    encode(message: Message): Packet {
        message.packetHeader.sessionId = this.peerSessionId;
        const {header, bytes} = MessageCodec.encodePayload(message);
        const headerBytes = MessageCodec.encodePacketHeader(message.packetHeader);
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, this.nodeId);
        return { header, bytes: Crypto.encrypt(this.encryptKey, bytes, nonce, headerBytes)};
    }

    getAttestationChallengeKey(): Buffer {
        return this.attestationKey;
    }

    setFabric(fabric: Fabric) {
        this.fabric = fabric;
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
        return this.nodeId;
    }

    getPeerNodeId() {
        return this.peerNodeId;
    }

    addSubscription(subscriptionBuilder: (subscriptionId: number) => SubscriptionHandler): number {
        const subscriptionId = this.nextSubscriptionId++;
        const subscription = subscriptionBuilder(subscriptionId);
        this.subscriptions.push(subscription);
        return subscriptionId;
    }

    clearSubscriptions() {
        this.subscriptions.forEach(subscription => subscription.cancel());
        this.subscriptions.length = 0;
    }

    private generateNonce(securityFlags: number, messageId: number, nodeId: bigint) {
        const buffer = new LEBufferWriter();
        buffer.writeUInt8(securityFlags);
        buffer.writeUInt32(messageId);
        buffer.writeUInt64(nodeId);
        return buffer.toBuffer();
    }
}
