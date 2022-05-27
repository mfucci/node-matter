import { Element } from "../codec/TlvCodec";
import { Template, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Session } from "../session/SessionManager";

export class Command<RequestT, ResponseT> {
    constructor(
        readonly id: number,
        readonly name: string,
        private readonly requestTemplate: Template<RequestT>,
        private readonly responseTemplate: Template<ResponseT>,
        private readonly handler: (request: RequestT, session: Session) => ResponseT,
    ) {}

    invoke(session: Session, args: Element) {
        const request = TlvObjectCodec.decodeElement(args, this.requestTemplate);
        const response = this.handler(request, session);
        return TlvObjectCodec.encodeElement(response, this.responseTemplate);
    }
}
