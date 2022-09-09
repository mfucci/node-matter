/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Template } from "../../codec/TlvObjectCodec";
import { Session } from "../../session/Session";
import { Attribute } from "./Attribute";
import { Command } from "./Command";

export class Cluster {
    private readonly attributesMap = new Map<number, Attribute<any>>();
    private readonly commandsMap = new Map<number, Command<any, any>>();

    constructor(
        readonly endpointId: number,
        readonly id: number,
        readonly name: string,
    ) {}

    addAttribute<T>(id: number, name: string, template: Template<T>, defaultValue: T) {
        const attribute = new Attribute(this.endpointId, this.id, id, name, template, defaultValue);
        this.attributesMap.set(id, attribute);
        return attribute;
    }

    addCommand<RequestT, ResponseT>(invokeId: number, responseId: number, name: string, requestTemplate: Template<RequestT>, responseTemplate: Template<ResponseT>, handler: (request: RequestT, session: Session) => Promise<ResponseT> | ResponseT) {
        const command = new Command(invokeId, responseId, this.name, requestTemplate, responseTemplate, handler);
        this.commandsMap.set(invokeId, command);
        return command;
    }
    
    getAttributeValue(attributeId?: number) {
        // If attributeId is not provided, iterate over all attributes
        var attributeIds = (attributeId === undefined) ? [...this.attributesMap.keys()] : [ attributeId ];

        return attributeIds.flatMap(attributeId => {
            const valueVersion = this.attributesMap.get(attributeId)?.getValue();
            return (valueVersion === undefined) ? [] : [{attributeId, ...valueVersion}];
        })
    }

    async invoke(session: Session, commandId: number, args: Element) {
        return this.commandsMap.get(commandId)?.invoke(session, args);
    }
}
