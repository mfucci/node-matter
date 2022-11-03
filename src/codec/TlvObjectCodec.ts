/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayM, ObjectM, TaggedModel, DataModel } from "./DataModels";
import { TlvType, Element, TlvCodec, TlvTag } from "./TlvCodec";

export class TlvObjectCodec {
    static decode<T>(bytes: Buffer, template: TaggedModel<T>): T {
        return this.decodeElement(TlvCodec.decodeElement(bytes), template);
    }

    static decodeElement<T>(element: Element | undefined, template: TaggedModel<T>, name: string = "root"): T {
        return this.decodeInternal(element, template, name) as T;
    }

    private static decodeInternal(element: Element | undefined, template: TaggedModel<any>, name: string): any {
        const {tlvType: expectedType, tag: expectedTag = TlvTag.Anonymous, postProcess: postDecoding = value => value, validator } = template;
        if (element === undefined) return undefined;
        const {tag, type} = element;
        let { value } = element;
        if (!tag.equals(expectedTag)) throw new Error(`Parameter ${name}: unexpected tag ${tag}. Expected was ${expectedTag}`);
        if (expectedType === undefined) {
            // Don't process the element since it has a variable type
            return {tag: TlvTag.Anonymous, value, type};
        }
        if (type !== expectedType) throw new Error(`Parameter ${name}: unexpected type ${type}. Expected was ${expectedType}`);
        value = postDecoding(value);
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
                return value;
            case TlvType.EndOfContainer:
                throw new Error("Invalid template");
            case TlvType.Array:
                return this.decodeArray(value as Element[], template as DataModel<any> as ArrayM<any>, name);
            case TlvType.List:
            case TlvType.Structure:
                return this.decodeObject(value as Element[], template as DataModel<any> as ObjectM<any>);
            default:
                throw new Error(`Unsupported element type ${type}`);
        }
    }

    private static decodeArray(elements: Element[], {itemTemplate}: ArrayM<any>, name: string) {
        return elements.map((element, index) => this.decodeElement(element, itemTemplate, `${name}[${index}]`));
    }

    private static decodeObject(elements: Element[], {fieldTemplates}: ObjectM<any>) {
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

    static encode<T>(value: T, template: TaggedModel<T>): Buffer {
        return TlvCodec.encodeElement(this.encodeElement(value, template));
    }

    static encodeElement<T>(value: T, template: TaggedModel<T>, name: string = "root") {
        return this.encodeInternal(value, template, name);
    }

    private static encodeInternal(value: any, template: TaggedModel<any>, name: string): Element | undefined {
        const {tlvType: type, tag = TlvTag.Anonymous, validator, preProcess: preEncoding = value => value} = template;
        if (value === undefined) return undefined;
        validator?.(value, name);
        value = preEncoding(value);

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
                return {tag, type, value: this.encodeArray(value as any[], template as ArrayM<any>, name)};
            case TlvType.List:
            case TlvType.Structure:
                return {tag, type, value: this.encodeObject(value, template as ObjectM<any>, name)};
            default:
                throw new Error(`Parameter ${name}: unsupported element type ${type}`);
        }
    }

    private static encodeArray(array: any[], {itemTemplate}: ArrayM<any>, name: string) {
        return array.map((item, index) => this.encodeInternal(item, itemTemplate, `${name}[${index}]`));
    }

    private static encodeObject(structure: any, {fieldTemplates}: ObjectM<any>, name: string) {
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
