import { Element } from "../codec/TlvCodec";
import { Template, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Session } from "../session/SessionManager";

const enum ResultCode {
    Success = 0x00,
}

export class Command<RequestT, ResponseT> {
    constructor(
        readonly invokeId: number,
        readonly responseId: number,
        readonly name: string,
        protected readonly requestTemplate: Template<RequestT>,
        protected readonly responseTemplate: Template<ResponseT>,
        protected readonly handler: (request: RequestT, session: Session) => Promise<ResponseT> | ResponseT,
    ) {}

    async invoke(session: Session, args: Element): Promise<{ result: ResultCode, responseId: number, response?: Element } | undefined> {
        const request = TlvObjectCodec.decodeElement(args, this.requestTemplate);
        const response = await this.handler(request, session);
        return { result: ResultCode.Success, responseId: this.responseId, response: TlvObjectCodec.encodeElement(response, this.responseTemplate) };
    }
}

export class CommandNoReponse<RequestT> extends Command<RequestT, void> {
    constructor(
        invokeId: number,
        name: string,
        requestTemplate: Template<RequestT>,
        handler: (request: RequestT, session: Session) => Promise<void> | void,
    ) {
        super(invokeId, invokeId, name, requestTemplate, {} as Template<void>, handler);
    }

    async invoke(session: Session, args: Element) {
        const request = TlvObjectCodec.decodeElement(args, this.requestTemplate);
        await this.handler(request, session);
        return { result: ResultCode.Success, responseId: this.responseId };
    }
}
