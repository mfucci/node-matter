/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Template } from "../../codec/TlvObjectCodec";
import { Session } from "../session/Session";
import { Attribute } from "./Attribute";
import { Command } from "./Command";

export class Cluster<ContextT> {
    private readonly attributesMap = new Map<number, Attribute<any>>();
    private readonly commandsMap = new Map<number, Command<any, any, any>>();

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

    addCommand<RequestT, ResponseT>(invokeId: number, responseId: number, name: string, requestTemplate: Template<RequestT>, responseTemplate: Template<ResponseT>, handler: (request: RequestT, session: Session<ContextT>) => Promise<ResponseT> | ResponseT) {
        const command = new Command(invokeId, responseId, name, requestTemplate, responseTemplate, handler);
        this.commandsMap.set(invokeId, command);
        return command;
    }

    getAttributes(attributeId?: number): Attribute<any>[] {
        if (attributeId === undefined) {
            // If the attributeId is not provided, return all attributes
            return [...this.attributesMap.values()];
        }
        
        const attribute = this.attributesMap.get(attributeId);
        if (attribute === undefined) return [];
        return [attribute];
    }

    async invoke(session: Session<ContextT>, commandId: number, args: Element) {
        return this.commandsMap.get(commandId)?.invoke(session, args);
    }
}
