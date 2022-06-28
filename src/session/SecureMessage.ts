import { Message } from "../codec/MessageCodec";
import { Session } from "./Session";

export interface SecureMessage {
    message: Message,
    session: Session,
}
