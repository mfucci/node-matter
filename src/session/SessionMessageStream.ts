import { Message, MessageCodec, Packet, SessionType } from "../codec/MessageCodec";
import { Stream } from "../util/Stream";
import { Session } from "./Session";

export class SessionMessageStream implements Stream<Message> {
    constructor(
        private readonly dataStream: Stream<Buffer>,
        private readonly session: Session,
    ) {}

    async read() {
        const packet = MessageCodec.decodePacket(await this.dataStream.read());
        if (packet.header.sessionType === SessionType.Group) throw new Error("Group messages are not supported");
        return this.session.decode(packet);
    }

    async write(message: Message) {
        await this.dataStream.write(this.session.encode(message));
    }

    toString() {
        return this.dataStream.toString();
    }
}
