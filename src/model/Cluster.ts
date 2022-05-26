import { Element } from "../codec/TlvCodec";
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
        commands.forEach(command => this.commandsMap.set(command.id, command));
    }

    addAttributes(attributes: Attribute<any>[]) {
        attributes.forEach(attribute => this.attributesMap.set(attribute.id, attribute));
    }
    
    getAttributeValue(attributeId: number) {
        return this.attributesMap.get(attributeId)?.getValue();
    }

    invoke(commandId: number, args: Element): Element | undefined {
        return this.commandsMap.get(commandId)?.invoke(args);
    }
}
