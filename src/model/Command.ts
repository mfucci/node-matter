import { Element } from "../codec/TlvCodec";
import { Template, TlvObjectCodec } from "../codec/TlvObjectCodec";

export class Command<RequestT, ResponseT> {
    constructor(
        readonly id: number,
        readonly name: string,
        private readonly requestTemplate: Template<RequestT>,
        private readonly responseTemplate: Template<ResponseT>,
        private readonly handler: (request: RequestT) => ResponseT,
    ) {}

    invoke(args: Element) {
        const request = TlvObjectCodec.decodeElement(args, this.requestTemplate);
        const response = this.handler(request);
        return TlvObjectCodec.encodeElement(response, this.responseTemplate);
    }
}
