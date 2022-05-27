import { Tag } from "../models/Tag";
import { TlvType, Element, TlvCodec } from "./TlvCodec";

// Type structure definitions
export type Template<T> = {tlvType?: TlvType};
type ArrayTemplate<T> = Template<T> & {itemTemplate: Template<T>};
type ObjectTemplate<T> = Template<T> & {fieldTemplates: FieldTemplates};
type TaggedTemplate<T> = Template<T> & {tag?: Tag};
type Field<T> = TaggedTemplate<T> & {optional: false};
type OptionalField<T> = TaggedTemplate<T> & {optional: true};
type FieldTemplates = {[key: string]: Field<any> | OptionalField<any>};

// Type utils
type OptionalKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? K : never}[keyof T];
type RequiredKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? never : K}[keyof T];
type FlattenField<F> = F extends Field<infer T> ? T : never;
type FlattenOptionalField<F> = F extends OptionalField<infer T> ? T : never;
type TypeFromFieldTemplates<T extends FieldTemplates> = { [P in RequiredKeys<T>]: FlattenField<T[P]> } & { [P in OptionalKeys<T>]?: FlattenOptionalField<T[P]> };
export type JsType<Type> = Type extends Template<infer T> ? T : never;

// Template definitions
export const StringT:Template<string> = { tlvType: TlvType.String};
export const BooleanT:Template<boolean> = { tlvType: TlvType.Boolean};
export const ByteStringT:Template<Buffer> = { tlvType: TlvType.ByteString};
export const UnsignedIntT:Template<number> = { tlvType: TlvType.UnsignedInt};
export const UnsignedLongT:Template<bigint> = { tlvType: TlvType.UnsignedInt};
export const AnyT:Template<any> = { };
export const ArrayT = <T,>(itemTemplate: Template<T>) => ({ tlvType: TlvType.Array, itemTemplate } as Template<T[]>);
export const ObjectT = <F extends FieldTemplates>(fieldTemplates: F, tlvType: TlvType = TlvType.Structure) => ({ tlvType, fieldTemplates } as Template<TypeFromFieldTemplates<F>>);
export const Field = <T,>(id: number, type: Template<T>):Field<T> =>  ({...type, tag: Tag.contextual(id), optional: false});
export const OptionalField = <T,>(id: number, type: Template<T>):OptionalField<T> =>  ({...Field(id, type), optional: true});

export class TlvObjectCodec {
    static decode<T>(bytes: Buffer, template: TaggedTemplate<T>): T {
        return this.decodeElement(TlvCodec.decodeElement(bytes), template);
    }

    static decodeElement<T>(element: Element | undefined, template: TaggedTemplate<T>): T {
        return this.decodeInternal(element, template) as T;
    }

    private static decodeInternal(element: Element | undefined, template: TaggedTemplate<any>): any {
        const {tlvType: expectedType, tag: expectedTag = Tag.Anonymous} = template;
        if (element === undefined) return undefined;
        const {tag, value, type} = element;
        if (!tag.equals(expectedTag)) throw new Error(`Unexpected tag ${tag}. Expected was ${expectedTag}`);
        if (expectedType === undefined) {
            // Don't process the element since it has a variable type
            return {tag: Tag.Anonymous, value, type};
        }
        if (type !== expectedType) throw new Error(`Unexpected type ${type}. Expected was ${expectedType}`);

        switch (type) {
            case TlvType.Boolean:
            case TlvType.String:
            case TlvType.ByteString:
            case TlvType.SignedInt:
            case TlvType.UnsignedInt:
            case TlvType.Float:
            case TlvType.Double:
            case TlvType.Null:
                return value;
            case TlvType.EndOfContainer:
                throw new Error("Invalid template");
            case TlvType.Array:
                return this.decodeArray(value as Element[], template as Template<any> as ArrayTemplate<any>);
            case TlvType.List:
            case TlvType.Structure:
                return this.decodeObject(value as Element[], template as Template<any> as ObjectTemplate<any>);
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static decodeArray(elements: Element[], {itemTemplate}: ArrayTemplate<any>) {
        return elements.map(element => this.decodeElement(element, itemTemplate));
    }

    private static decodeObject(elements: Element[], {fieldTemplates}: ObjectTemplate<any>) {
        const result: any = {};
        for (var key in fieldTemplates) {
            const template = fieldTemplates[key];
            const {tag: expectedTag = Tag.Anonymous} = template;
            const element = elements.find(({tag}) => tag.equals(expectedTag));
            const value = this.decodeInternal(element, template);
            if (value === undefined) {
                if (!template.optional) throw new Error(`Missing mandatory field ${key}`);
                continue;
            }
            result[key] = value;
        }
        return result;
    }

    static encode<T>(value: T, template: TaggedTemplate<T>): Buffer {
        return TlvCodec.encodeElement(this.encodeElement(value, template));
    }

    static encodeElement<T>(value: T, template: TaggedTemplate<T>) {
        return this.encodeInternal(value, template);
    }

    private static encodeInternal(value: any, template: TaggedTemplate<any>): Element | undefined {
        const {tlvType: type, tag = Tag.Anonymous} = template;
        if (value === undefined) return undefined;

        switch (type) {
            case undefined: // Variable type, so this value should already be pre-processed
                return {...(value as Element), tag};
            case TlvType.Boolean:
            case TlvType.String:
            case TlvType.ByteString:
            case TlvType.SignedInt:
            case TlvType.UnsignedInt:
            case TlvType.Float:
            case TlvType.Double:
            case TlvType.Null:
                return {tag, type, value};
            case TlvType.EndOfContainer:
                throw new Error("Invalid template");
            case TlvType.Array:
                return {tag, type, value: this.encodeArray(value as any[], template as ArrayTemplate<any>)};
            case TlvType.List:
            case TlvType.Structure:
                return {tag, type, value: this.encodeObject(value, template as ObjectTemplate<any>)};
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static encodeArray(array: any[], {itemTemplate}: ArrayTemplate<any>) {
        return array.map(item => this.encodeInternal(item, itemTemplate));
    }

    private static encodeObject(structure: any, {fieldTemplates}: ObjectTemplate<any>) {
        const result = new Array<Element>();
        for (var key in fieldTemplates) {
            const template = fieldTemplates[key];
            const value = structure[key];
            if (value === undefined) {
                if (!template.optional) throw new Error(`Missing mandatory field ${key}`);
                continue;
            }
            const element = this.encodeInternal(value, template);
            if (element === undefined) continue;
            result.push(element);
        }
        return result;
    }
}
