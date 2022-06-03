import { Message, MessageCodec, Packet } from "../codec/MessageCodec";
import { Crypto } from "../crypto/Crypto";
import { Fabric } from "../fabric/Fabric";
import { UNDEFINED_NODE_ID } from "../transport/Dispatcher";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { Session } from "./SessionManager";

const SESSION_KEYS_INFO = Buffer.from("SessionKeys");
const AUTH_TAG_LENGTH = 16;

export class SecureSession implements Session {
    private fabric?: Fabric;

    constructor(
        private readonly id: number,
        private readonly peerSessionId: number,
        private readonly sharedSecret: Buffer,
        private readonly decryptKey: Buffer,
        private readonly encryptKey: Buffer,
        private readonly attestationKey: Buffer,
    ) {}

    static async create(id: number, peerSessionId: number, sharedSecret: Buffer, salt: Buffer, isInitiator: boolean) {
        const keys = await Crypto.hkdf(sharedSecret, salt, SESSION_KEYS_INFO, 16 * 3);
        const decryptKey = isInitiator ? keys.slice(16, 32) : keys.slice(0, 16);
        const encryptKey = isInitiator ? keys.slice(0, 16) : keys.slice(16, 32);
        const attestationKey = keys.slice(32, 48);
        return new SecureSession(id, peerSessionId, sharedSecret, decryptKey, encryptKey, attestationKey);
    }

    decode({ header, bytes }: Packet): Message {
        const headerBytes = MessageCodec.encodePacketHeader(header);
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, UNDEFINED_NODE_ID);
        console.log("decode",  Crypto.decrypt(this.decryptKey, bytes, nonce, headerBytes).toString("hex"));
        return MessageCodec.decodePayload({ header, bytes: Crypto.decrypt(this.decryptKey, bytes, nonce, headerBytes) });
    }
    
    encode(message: Message): Packet {
        message.packetHeader.sessionId = this.peerSessionId;
        const {header, bytes} = MessageCodec.encodePayload(message);
        console.log("encode",  bytes.toString("hex"));
        const headerBytes = MessageCodec.encodePacketHeader(message.packetHeader);
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, UNDEFINED_NODE_ID);
        return { header, bytes: Crypto.encrypt(this.encryptKey, bytes, nonce, headerBytes)};
    }

    getAttestationChallengeKey(): Buffer {
        return this.attestationKey;
    }

    setFabric(fabric: Fabric) {
        this.fabric = fabric;
    }

    getName() {
        return `secure/${this.id}`;
    }

    private generateNonce(securityFlags: number, messageId: number, nodeId: bigint) {
        const buffer = new LEBufferWriter();
        buffer.writeUInt8(securityFlags);
        buffer.writeUInt32(messageId);
        buffer.writeUInt64(nodeId);
        return buffer.toBuffer();
    }
}
