import { Message, MessageCodec, Packet } from "../codec/MessageCodec";
import { Crypto } from "../crypto/Crypto";
import { UNDEFINED_NODE_ID } from "../transport/Dispatcher";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { Session } from "./SessionManager";

const SESSION_KEYS_INFO = Buffer.from("SessionKeys");
const AUTH_TAG_LENGTH = 16;

export class SecureSession implements Session {

    constructor(
        private readonly peerSessionId: number,
        private readonly sharedSecret: Buffer,
        private readonly decryptKey: Buffer,
        private readonly encryptKey: Buffer,
        private readonly attestationKey: Buffer,
    ) {}

    static async create(peerSessionId: number, sharedSecret: Buffer, isInitiator: boolean) {
        const keys = await Crypto.hkdf(sharedSecret, Buffer.alloc(0), SESSION_KEYS_INFO, 16 * 3);
        const decryptKey = isInitiator ? keys.slice(16, 32) : keys.slice(0, 16);
        const encryptKey = isInitiator ? keys.slice(0, 16) : keys.slice(16, 32);
        const attestationKey = keys.slice(32, 48);
        return new SecureSession(peerSessionId, sharedSecret, decryptKey, encryptKey, attestationKey);
    }

    decode({ header, bytes }: Packet): Message {
        const headerBytes = MessageCodec.encodePacketHeader(header);
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, UNDEFINED_NODE_ID);
        const bytesLength = bytes.length;
        const encryptedBytes = bytes.slice(0, bytesLength - AUTH_TAG_LENGTH);
        const tag = bytes.slice(bytesLength - AUTH_TAG_LENGTH);
        const decryptedBytes = Crypto.decrypt(this.decryptKey, encryptedBytes, tag, nonce, headerBytes);

        return MessageCodec.decodePayload({ header, bytes: decryptedBytes });
    }
    
    encode(message: Message): Packet {
        message.packetHeader.sessionId = this.peerSessionId;
        const {header, bytes} = MessageCodec.encodePayload(message);
        const headerBytes = MessageCodec.encodePacketHeader(message.packetHeader);
        console.log(headerBytes.toString("hex"));
        const securityFlags = headerBytes.readUInt8(3);
        const nonce = this.generateNonce(securityFlags, header.messageId, UNDEFINED_NODE_ID);
        const { data: encryptedBytes, tag } = Crypto.encrypt(this.encryptKey, bytes, nonce, headerBytes);

        return { header, bytes: Buffer.concat([encryptedBytes, tag])};
    }

    private generateNonce(securityFlags: number, messageId: number, nodeId: bigint) {
        const buffer = new LEBufferWriter();
        buffer.writeUInt8(securityFlags);
        buffer.writeUInt32(messageId);
        buffer.writeUInt64(nodeId);
        return buffer.toBuffer();
    }
}
