/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Merge } from "../util/Type";
import { TlvTag, TlvType } from "./TlvCodec";

/** Define structure, constraints and mapping for Matter strcutured data.  */
export interface DataModel<T> {
    tlvType?: TlvType,
    postProcess?: (value: any) => T,
    preProcess?: (value: T) => any,
    validator?: (value: T, name: string, model: DataModel<T>) => void,
};

type FixedOrVariableLengthConstraints = { length: number } | { minLength: number, maxLength: number };

// Define array data model
export type ArrayM<T> = Merge<{ tlvType: TlvType.Array, itemTemplate: DataModel<T> }, FixedOrVariableLengthConstraints>;

// Define string data model
export type StringM = Merge<{ tlvType: TlvType.String }, FixedOrVariableLengthConstraints>;

// Define byte buffer data model
export type ByteStringT = Merge<{ tlvType: TlvType.ByteString }, FixedOrVariableLengthConstraints>;

// Define object data model
export interface TaggedModel<T> extends DataModel<T> { tag?: TlvTag };
export interface Field<T> extends TaggedModel<T> { optional: false };
export interface OptionalField<T> extends TaggedModel<T> { optional: true };
export type FieldModels = { [key: string]: Field<any> | OptionalField<any> };
export interface ObjectM<T> extends DataModel<T> { fieldTemplates: FieldModels };

// Define Bitmap data model
interface BitTemplate { position: number }
type BitTemplates = {[key: string]: BitTemplate};
type TypeFromBitTemplates<T extends BitTemplates> = {[K in keyof T]: boolean};
function decodeBitMap<T extends BitTemplates>(bits: T, bitmap: number): TypeFromBitTemplates<T> {
    const result = <TypeFromBitTemplates<T>>{};
    for (const name in bits) {
        result[name] = (bitmap & (1 << bits[name].position)) !== 0;
    }
    return result;
}
function encodeBitMap<T extends BitTemplates>(bits: T, flags: TypeFromBitTemplates<T>): number {
    let result = 0;
    for (const name in bits) {
        if (flags[name]) result |= 1 << bits[name].position;
    }
    return result;
}

// Auto-generation of js types
type OptionalKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? K : never}[keyof T];
type RequiredKeys<T extends object> = {[K in keyof T]: T[K] extends OptionalField<any> ? never : K}[keyof T];
export type JsType<Type> = Type extends DataModel<infer T> ? T : never;
export type JsTypeFromFields<T extends FieldModels> = Merge<{ [P in RequiredKeys<T>]: JsType<T[P]> }, { [P in OptionalKeys<T>]?: JsType<T[P]> }>;

// Constraints
export class InvalidParameterError extends Error {}

export type IntConstraints = {
    min?: number | bigint ,
    max?: number | bigint,
}
const intValidator = ({ min, max }: IntConstraints) => (value: number | bigint, name: string) => {
    if (min !== undefined && value < min) throw new InvalidParameterError(`Parameter ${name} is lower than ${min}. Value: ${value}`);
    if (max !== undefined && value > max) throw new InvalidParameterError(`Parameter ${name} is higher than ${max}. Value: ${value}`);
}

export type ArrayConstraints = {
    minLength?: number,
    maxLength?: number,
    length?: number,
}
function valueToString(value: string | Buffer | Array<any>) {
    if (typeof value === "string") {
        return `"${value}"`;
    } else if (Buffer.isBuffer(value)) {
        return `0x${value.toString("hex")}`;
    } else {
        return value.toString();
    }
}
const lengthValidator = (value: string | Buffer | Array<any>, name: string, constraints: FixedOrVariableLengthConstraints) => {
    const valueLength = value.length;
    if (length !== undefined) {
        if (valueLength !== length) throw new InvalidParameterError(`Parameter ${name} should have a length of ${length}. Length: ${valueLength}, value: ${valueToString(value)}`);
    } else {
        if (valueLength < minLength) throw new InvalidParameterError(`Parameter ${name} is shorter than ${minLength}. Length: ${valueLength}, value: ${valueToString(value)}`);
        if (maxLength !== undefined && valueLength > maxLength) throw new InvalidParameterError(`Parameter ${name} is longer than ${maxLength}. Length: ${valueLength}, value: ${valueToString(value)}`);
    }
}

// Bitmap processing

// Template definitions
export const Constraint = <T,>(template: DataModel<T>, validator: (value: T, name: string) => void): DataModel<T> => ({...template, validator });
export const StringM = (constraints: ArrayConstraints = { maxLength: 256 }):DataModel<string> => ({ tlvType: TlvType.String, validator: lengthValidator(constraints) });
export const BooleanT:DataModel<boolean> = { tlvType: TlvType.Boolean };
export const Bit = (position: number) => ({ position });
export const BitMapT = <T extends BitTemplates>(bits: T): DataModel<TypeFromBitTemplates<T>> => ({ tlvType: TlvType.UnsignedInt, postProcess: (bitMap: number) => decodeBitMap(bits, bitMap), preProcess: (flags: TypeFromBitTemplates<T>) => encodeBitMap(bits, flags)});
export const ByteStringT = (constraints: ArrayConstraints = { maxLength: 256 }):DataModel<Buffer> => ({ tlvType: TlvType.ByteString, validator: lengthValidator(constraints) });
export const UInt8T: DataModel<number> = { tlvType: TlvType.UnsignedInt, validator: intValidator({ min: 0, max: 0xFF }) };
export const UInt16T: DataModel<number> = { tlvType: TlvType.UnsignedInt, validator: intValidator({ min: 0, max: 0xFFFF }) };
export const UInt32T: DataModel<number> = { tlvType: TlvType.UnsignedInt, validator: intValidator({ min: 0, max: 0xFFFFFFFF }) };
export const UInt64T: DataModel<bigint> = { tlvType: TlvType.UnsignedInt, validator: intValidator({ min: 0, max: BigInt("18446744073709551616") }), postProcess: (value: number | bigint) => BigInt(value) };
export const Bound = <T extends number | bigint>(template: DataModel<T>, {min, max}: IntConstraints = {}):DataModel<T> => ({ ...template, validator: (value: T, name: string) => {intValidator({min, max})(value, name); template.validator?.(value, name)}});
export const AnyT:DataModel<any> = { };
export const ArrayT = <T,>(itemTemplate: DataModel<T>, constraints?: ArrayConstraints) => ({ tlvType: TlvType.Array, itemTemplate, validator: constraints ? lengthValidator(constraints) : (() => {}) } as DataModel<T[]>);
export const ObjectT = <F extends FieldModels>(fieldTemplates: F, tlvType: TlvType = TlvType.Structure) => ({ tlvType, fieldTemplates } as DataModel<JsTypeFromFields<F>>);
export const EnumT = <T,>() => ({ tlvType: TlvType.UnsignedInt } as DataModel<T>);
export const Typed = <T,>(template: DataModel<any>) => template as DataModel<T>;
export const Field = <T,>(id: number, type: DataModel<T>):Field<T> =>  ({...type, tag: TlvTag.contextual(id), optional: false});
export const OptionalField = <T,>(id: number, type: DataModel<T>):OptionalField<T> =>  ({...Field(id, type), optional: true});