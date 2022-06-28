import { Message, Packet, SessionType } from "../codec/MessageCodec";
import { Stream } from "../util/Stream";
import { Session } from "./Session";

export class SecureMessageStream implements Stream<Message> {
    constructor(
        private readonly packetStream: Stream<Packet>,
        private readonly session: Session,
    ) {}

    async read() {
        return this.session.decode(await this.packetStream.read());
    }

    async write(message: Message) {
        await this.packetStream.write(this.session.encode(message));
    }

    toString() {
        return this.packetStream.toString();
    }
}
