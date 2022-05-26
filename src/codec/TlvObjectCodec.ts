import { Tag } from "../models/Tag";
import { PrimitiveType, Element, TlvCodec } from "./TlvCodec";

export interface ElementTemplate {
    type: PrimitiveType,
    tag: Tag,
}
export type PropTemplate = {template: Template<any>, optional: boolean};
export type PropsTemplate<T> = {[key in keyof T]: PropTemplate};
export type ObjectTemplate<T> = ElementTemplate & {
    propsTemplate: PropsTemplate<T>,
};
export type ArrayTemplate<T> = ElementTemplate & {
    itemTemplate: Template<T>,
};
export type RawElementTemplate = {
    type: undefined,
    tag: Tag,
}

export type Template<T> = ElementTemplate | ObjectTemplate<T> | ArrayTemplate<T> | RawElementTemplate;

export const RawElementTemplate = {type: undefined, tag: Tag.Anonymous};
export const ObjectTemplate = <T,>(propsTemplate: PropsTemplate<T>, tag: Tag = Tag.Anonymous, type: PrimitiveType = PrimitiveType.Structure): ObjectTemplate<T> => ({tag, type, propsTemplate});
export const ArrayTemplate = <T,>(itemTemplate: Template<T>, tag: Tag = Tag.Anonymous):ArrayTemplate<T> => ({ tag, type: PrimitiveType.Array, itemTemplate });
export const OptionalField = (id: number, type: PrimitiveType | Template<any>):PropTemplate => Field(id, type, true);
export const Field = (id: number, type: PrimitiveType | Template<any>, optional: boolean = false):PropTemplate => ({template: (typeof type === "number") ? { type, tag: Tag.contextual(id)} : {...type, tag: Tag.contextual(id)}, optional });

export class TlvObjectCodec {
    static decode<T>(bytes: Buffer, template: Template<T>): T {
        return this.decodeElement(TlvCodec.decodeElement(bytes), template);
    }

    static decodeElement<T>(element: Element | undefined, template: Template<T>): T {
        return this.decodeInternal(element, template) as T;
    }

    private static decodeInternal(element: Element | undefined, template: Template<any>): any {
        const {type: expectedType, tag: expectedTag} = template;
        if (element === undefined) return undefined;
        const {tag, value, type} = element;
        if (!tag.equals(expectedTag)) throw new Error(`Unexpected tag ${tag}. Expected was ${expectedTag}`);
        if (expectedType === undefined) {
            // Don't process the element since it has a variable type
            return {tag: Tag.Anonymous, value, type};
        }
        if (type !== expectedType) throw new Error(`Unexpected type ${type}. Expected was ${expectedType}`);

        switch (type) {
            case PrimitiveType.Boolean:
            case PrimitiveType.String:
            case PrimitiveType.ByteString:
            case PrimitiveType.SignedInt:
            case PrimitiveType.UnsignedInt:
            case PrimitiveType.Float:
            case PrimitiveType.Double:
            case PrimitiveType.Null:
                return value;
            case PrimitiveType.EndOfContainer:
                throw new Error("Invalid template");
            case PrimitiveType.Array:
                return this.decodeArray(value as Element[], template as ArrayTemplate<any>);
            case PrimitiveType.List:
            case PrimitiveType.Structure:
                return this.decodeObject(value as Element[], template as ObjectTemplate<any>);
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static decodeArray(elements: Element[], {itemTemplate}: ArrayTemplate<any>) {
        return elements.map(element => this.decodeElement(element, itemTemplate));
    }

    private static decodeObject(elements: Element[], {propsTemplate}: ObjectTemplate<any>) {
        const result: any = {};
        for (var key in propsTemplate) {
            const {template, optional} = propsTemplate[key];
            const element = elements.find(({tag}) => tag.equals(template.tag));
            const value = this.decodeInternal(element, template);
            if (value === undefined) {
                if (!optional) throw new Error(`Missing mandatory field ${key}`);
                continue;
            }
            result[key] = value;
        }
        return result;
    }

    static encode<T>(value: T, template: Template<T>): Buffer {
        return TlvCodec.encodeElement(this.encodeElement(value, template));
    }

    static encodeElement<T>(value: T, template: Template<T>) {
        return this.encodeInternal(value, template);
    }

    private static encodeInternal(value: any, template: Template<any>): Element | undefined {
        const {type: type, tag} = template;
        if (value === undefined) return undefined;

        switch (type) {
            case undefined: // Variable type, so this value should already be pre-processed
                return {...(value as Element), tag};
            case PrimitiveType.Boolean:
            case PrimitiveType.String:
            case PrimitiveType.ByteString:
            case PrimitiveType.SignedInt:
            case PrimitiveType.UnsignedInt:
            case PrimitiveType.Float:
            case PrimitiveType.Double:
            case PrimitiveType.Null:
                return {tag, type, value};
            case PrimitiveType.EndOfContainer:
                throw new Error("Invalid template");
            case PrimitiveType.Array:
                return {tag, type, value: this.encodeArray(value as any[], template as ArrayTemplate<any>)};
            case PrimitiveType.List:
            case PrimitiveType.Structure:
                return {tag, type, value: this.encodeObject(value, template as ObjectTemplate<any>)};
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static encodeArray(array: any[], {itemTemplate}: ArrayTemplate<any>) {
        return array.map(item => this.encodeInternal(item, itemTemplate));
    }

    private static encodeObject(structure: any, {propsTemplate}: ObjectTemplate<any>) {
        const result = new Array<Element>();
        for (var key in propsTemplate) {
            const {template, optional} = propsTemplate[key];
            const value = structure[key];
            if (value === undefined) {
                if (!optional) throw new Error(`Missing mandatory field ${key}`);
                continue;
            }
            const element = this.encodeInternal(value, template);
            if (element === undefined) continue;
            result.push(element);
        }
        return result;
    }
}
