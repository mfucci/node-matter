import { Packet, Message, MessageCodec } from "../codec/Message";
import { Session } from "./SessionManager";

export class UnsecureSession implements Session {
    decode(packet: Packet): Message {
        return MessageCodec.decodePayload(packet);
    }

    encode(message: Message): Packet {
        return MessageCodec.encodePayload(message);
    }
}
