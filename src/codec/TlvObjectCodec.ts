/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Merge } from "../util/Type";
import { TlvType, Element, TlvCodec, TlvTag } from "./TlvCodec";

// Type structure definitions
export interface Template<T> {
    tlvType?: TlvType,
    readAsBigint?: boolean,
    validator?: (value: T, name: string) => void,
};
export interface ArrayTemplate<T> extends Template<T> {itemTemplate: Template<T>};
export interface ObjectTemplate<T> extends Template<T> {fieldTemplates: FieldTemplates};
export interface TaggedTemplate<T> extends Template<T> {tag?: TlvTag};
export interface Field<T> extends TaggedTemplate<T> {optional: false};
export interface OptionalField<T> extends TaggedTemplate<T> {optional: true};
type FieldTemplates = {[key: string]: Field<any> | OptionalField<any>};

// Type utils
type OptionalKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? K : never}[keyof T];
type RequiredKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? never : K}[keyof T];
export type JsType<Type> = Type extends Template<infer T> ? T : never;
export type TypeFromFieldTemplates<T extends FieldTemplates> = Merge<{ [P in RequiredKeys<T>]: JsType<T[P]> }, { [P in OptionalKeys<T>]?: JsType<T[P]> }>;

// Constraints definitions
export type IntConstraints = {
    min?: number,
    max?: number,
}
export type StringConstraints = {
    minLength?: number,
    maxLength?: number,
    length?: number,
}

export class InvalidParameterError extends Error {}

const stringValidator = ({ minLength = 0, maxLength, length }: StringConstraints) => (value: string, name: string) => {
    const valueLength = value.length;
    if (length !== undefined) {
        if (valueLength !== length) throw new InvalidParameterError(`Parameter ${name} should have a length of ${length}. Value: "${value}"`);
    } else {
        if (valueLength < minLength) throw new InvalidParameterError(`Parameter ${name} is shorter than ${minLength} characters. Value: "${value}"`);
        if (maxLength !== undefined && valueLength > maxLength) throw new InvalidParameterError(`Parameter ${name} is longer than ${maxLength} characters. Value: "${value}"`);
    }
}

const intValidator = ({ min, max }: IntConstraints) => (value: number | bigint, name: string) => {
    if (min !== undefined && value < min) throw new InvalidParameterError(`Parameter ${name} is lower than ${min}. Value: "${value}"`);
    if (max !== undefined && value > max) throw new InvalidParameterError(`Parameter ${name} is higher than ${max}. Value: "${value}"`);
}

// Template definitions
export const Constraint = <T,>(template: Template<T>, validator: (value: T, name: string) => void): Template<T> => ({...template, validator });
export const StringT = (constraints: StringConstraints = { maxLength: 256 }):Template<string> => ({ tlvType: TlvType.String, validator: stringValidator(constraints) } as Template<string>);
export const BooleanT:Template<boolean> = { tlvType: TlvType.Boolean };
export const ByteStringT:Template<Buffer> = { tlvType: TlvType.ByteString };
export const UnsignedIntT:Template<number> = { tlvType: TlvType.UnsignedInt };
export const BoundedUnsignedIntT = ({min = 0, max}: IntConstraints = {}):Template<number> => ({ tlvType: TlvType.UnsignedInt, validator: intValidator({min: Math.max(min, 0), max })});
export const UnsignedLongT:Template<bigint> = { tlvType: TlvType.UnsignedInt, readAsBigint: true };
export const BoundedUnsignedLongT = ({min = 0, max}: IntConstraints = {}):Template<number> => ({ tlvType: TlvType.UnsignedInt, readAsBigint: true, validator: intValidator({min: Math.max(min, 0), max })});
export const AnyT:Template<any> = { };
export const ArrayT = <T,>(itemTemplate: Template<T>) => ({ tlvType: TlvType.Array, itemTemplate } as Template<T[]>);
export const ObjectT = <F extends FieldTemplates>(fieldTemplates: F, tlvType: TlvType = TlvType.Structure) => ({ tlvType, fieldTemplates } as Template<TypeFromFieldTemplates<F>>);
export const EnumT = <T,>() => ({ tlvType: TlvType.UnsignedInt } as Template<T>);
export const Field = <T,>(id: number, type: Template<T>):Field<T> =>  ({...type, tag: TlvTag.contextual(id), optional: false});
export const OptionalField = <T,>(id: number, type: Template<T>):OptionalField<T> =>  ({...Field(id, type), optional: true});

export class TlvObjectCodec {
    static decode<T>(bytes: Buffer, template: TaggedTemplate<T>): T {
        return this.decodeElement(TlvCodec.decodeElement(bytes), template);
    }

    static decodeElement<T>(element: Element | undefined, template: TaggedTemplate<T>, name: string = "root"): T {
        return this.decodeInternal(element, template, name) as T;
    }

    private static decodeInternal(element: Element | undefined, template: TaggedTemplate<any>, name: string): any {
        const {tlvType: expectedType, tag: expectedTag = TlvTag.Anonymous, readAsBigint, validator } = template;
        if (element === undefined) return undefined;
        const {tag, value, type} = element;
        if (!tag.equals(expectedTag)) throw new Error(`Parameter ${name}: unexpected tag ${tag}. Expected was ${expectedTag}`);
        if (expectedType === undefined) {
            // Don't process the element since it has a variable type
            return {tag: TlvTag.Anonymous, value, type};
        }
        if (type !== expectedType) throw new Error(`Parameter ${name}: unexpected type ${type}. Expected was ${expectedType}`);
        validator?.(value, name);

        switch (type) {
            case TlvType.Boolean:
            case TlvType.String:
            case TlvType.ByteString:
            case TlvType.Float:
            case TlvType.Double:
            case TlvType.Null:
                return value;
            case TlvType.UnsignedInt:
            case TlvType.SignedInt:
                if (readAsBigint) return BigInt(value);
                return value;
            case TlvType.EndOfContainer:
                throw new Error("Invalid template");
            case TlvType.Array:
                return this.decodeArray(value as Element[], template as Template<any> as ArrayTemplate<any>, name);
            case TlvType.List:
            case TlvType.Structure:
                return this.decodeObject(value as Element[], template as Template<any> as ObjectTemplate<any>);
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static decodeArray(elements: Element[], {itemTemplate}: ArrayTemplate<any>, name: string) {
        return elements.map((element, index) => this.decodeElement(element, itemTemplate, `${name}[${index}]`));
    }

    private static decodeObject(elements: Element[], {fieldTemplates}: ObjectTemplate<any>) {
        const result: any = {};
        for (var key in fieldTemplates) {
            const template = fieldTemplates[key];
            const {tag: expectedTag = TlvTag.Anonymous} = template;
            const element = elements.find(({tag}) => tag.equals(expectedTag));
            const value = this.decodeInternal(element, template, key);
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

    static encodeElement<T>(value: T, template: TaggedTemplate<T>, name: string = "root") {
        return this.encodeInternal(value, template, name);
    }

    private static encodeInternal(value: any, template: TaggedTemplate<any>, name: string): Element | undefined {
        const {tlvType: type, tag = TlvTag.Anonymous, validator} = template;
        if (value === undefined) return undefined;
        validator?.(value, name);

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
                throw new Error(`Parameter ${name}: Invalid template`);
            case TlvType.Array:
                return {tag, type, value: this.encodeArray(value as any[], template as ArrayTemplate<any>, name)};
            case TlvType.List:
            case TlvType.Structure:
                return {tag, type, value: this.encodeObject(value, template as ObjectTemplate<any>, name)};
            default:
                throw new Error(`Parameter ${name}: unsupported element type ${type}`);
        }
    }

    private static encodeArray(array: any[], {itemTemplate}: ArrayTemplate<any>, name: string) {
        return array.map((item, index) => this.encodeInternal(item, itemTemplate, `${name}[${index}]`));
    }

    private static encodeObject(structure: any, {fieldTemplates}: ObjectTemplate<any>, name: string) {
        const result = new Array<Element>();
        for (var key in fieldTemplates) {
            const template = fieldTemplates[key];
            const value = structure[key];
            if (value === undefined) {
                if (!template.optional) throw new Error(`Parameter ${name}: Missing mandatory field ${key}`);
                continue;
            }
            const element = this.encodeInternal(value, template, key);
            if (element === undefined) continue;
            result.push(element);
        }
        return result;
    }
}
