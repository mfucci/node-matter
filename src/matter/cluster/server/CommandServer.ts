/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataModel } from "../../../codec/DataModels";
import { Element } from "../../../codec/TlvCodec";
import { TlvObjectCodec } from "../../../codec/TlvObjectCodec";
import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";

export const enum ResultCode {
    Success = 0x00,
}

export class CommandServer<RequestT, ResponseT> {
    constructor(
        readonly invokeId: number,
        readonly responseId: number,
        readonly name: string,
        protected readonly requestTemplate: DataModel<RequestT>,
        protected readonly responseTemplate: DataModel<ResponseT>,
        protected readonly handler: (request: RequestT, session: Session<MatterDevice>) => Promise<ResponseT> | ResponseT,
    ) {}

    async invoke(session: Session<MatterDevice>, args: Element): Promise<{ code: ResultCode, responseId: number, response?: Element }> {
        const request = TlvObjectCodec.decodeElement(args, this.requestTemplate);
        const response = await this.handler(request, session);
        return { code: ResultCode.Success, responseId: this.responseId, response: TlvObjectCodec.encodeElement(response, this.responseTemplate) };
    }
}
