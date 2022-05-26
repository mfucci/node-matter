import { PrimitiveType } from "../codec/TlvCodec";
import { Template, TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Tag } from "../models/Tag";

export class Attribute<T> {
    private value: T;
    private version = 0;
    private template: Template<T>;

    constructor(
        readonly id: number,
        readonly name: string,
        templateOrType: Template<T> | PrimitiveType,
        defaultValue: T,
    ) {
        this.value = defaultValue;
        this.template = typeof templateOrType === "number" ? {tag: Tag.Anonymous, type: templateOrType} : templateOrType;
    }

    set(value: T) {
        this.version++;
        this.value = value;
    }

    get(): T {
        return this.value;
    }

    getValue() {
        return {
            version: this.version,
            value: TlvObjectCodec.encodeElement(this.value, this.template),
        }
    }
}
