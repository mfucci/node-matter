/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Session } from "../../session/SessionManager";
import { Attribute } from "./Attribute";
import { Command } from "./Command";

export class Cluster {
    private readonly attributesMap = new Map<number, Attribute<any>>();
    private readonly commandsMap = new Map<number, Command<any, any>>();

    constructor(
        readonly id: number,
        readonly name: string,
        commands?: Command<any, any>[],
        attributes?: Attribute<any>[],
    ) {
        if (commands !== undefined) this.addCommands(commands);
        if (attributes !== undefined) this.addAttributes(attributes);
    }

    addCommands(commands: Command<any, any>[]) {
        commands.forEach(command => this.commandsMap.set(command.invokeId, command));
    }

    addAttributes(attributes: Attribute<any>[]) {
        attributes.forEach(attribute => this.attributesMap.set(attribute.id, attribute));
    }
    
    getAttributeValue(attributeId: number) {
        return this.attributesMap.get(attributeId)?.getValue();
    }

    async invoke(session: Session, commandId: number, args: Element) {
        return this.commandsMap.get(commandId)?.invoke(session, args);
    }
}
