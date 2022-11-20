/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Merge } from "../../util/Type";
import { tlv, schema } from "@project-chip/matter.js";

export const enum AccessLevel {
    View,
    Manage,
    Administer,
}

/* Interfaces and helper methods to define a cluster attribute */
export interface Attribute<T> { id: number, schema: tlv.Schema<T>, optional: boolean, readAcl: AccessLevel, writable: boolean, writeAcl?: AccessLevel, default?: T }
export interface OptionalAttribute<T> extends Attribute<T> { optional: true }
export interface WritableAttribute<T> extends Attribute<T> { writable: true }
export interface OptionalWritableAttribute<T> extends OptionalAttribute<T> { writable: true }
export type AttributeJsType<T extends Attribute<any>> = T extends Attribute<infer JsType> ? JsType : never;
interface AttributeOptions<T> { default?: T, readAcl?: AccessLevel, writeAcl?: AccessLevel };
export const Attribute = <T, V extends T>(id: number, schema: tlv.Schema<T>, { default: conformanceValue, readAcl = AccessLevel.View }: AttributeOptions<V> = {}): Attribute<T> => ({ id, schema, optional: false, writable: false, default: conformanceValue, readAcl });
export const OptionalAttribute = <T, V extends T>(id: number, schema: tlv.Schema<T>, { default: conformanceValue, readAcl = AccessLevel.View }: AttributeOptions<V> = {}): OptionalAttribute<T> => ({ id, schema, optional: true, writable: false, default: conformanceValue, readAcl });
export const WritableAttribute = <T, V extends T>(id: number, schema: tlv.Schema<T>, { default: conformanceValue, readAcl = AccessLevel.View, writeAcl = AccessLevel.View }: AttributeOptions<V> = {}): WritableAttribute<T> => ({ id, schema, optional: false, writable: true, default: conformanceValue, readAcl, writeAcl });
export const OptionalWritableAttribute = <T, V extends T>(id: number, schema: tlv.Schema<T>, { default: conformanceValue, readAcl = AccessLevel.View, writeAcl = AccessLevel.View }: AttributeOptions<V> = {}): WritableAttribute<T> => ({ id, schema, optional: true, writable: true, default: conformanceValue, readAcl, writeAcl });

/* Interfaces and helper methods to define a cluster command */
export const TlvNoArguments = tlv.Object({});
export const TlvNoResponse = <tlv.Schema<void>>{};
export interface Command<RequestT, ResponseT> { optional: boolean, requestId: number, requestSchema: tlv.Schema<RequestT>, responseId: number, responseSchema: tlv.Schema<ResponseT> };
export interface OptionalCommand<RequestT, ResponseT> extends Command<RequestT, ResponseT> { optional: true };
export type ResponseType<T extends Command<any, any>> = T extends OptionalCommand<any, infer ResponseT> ? ResponseT | undefined : (T extends Command<any, infer ResponseT> ? ResponseT : never);
export type RequestType<T extends Command<any, any>> = T extends Command<infer RequestT, any> ? RequestT : never;
export const Command = <RequestT, ResponseT>(requestId: number, requestSchema: tlv.Schema<RequestT>, responseId: number, responseSchema: tlv.Schema<ResponseT>): Command<RequestT, ResponseT> => ({ optional: false, requestId, requestSchema, responseId, responseSchema });
export const OptionalCommand = <RequestT, ResponseT>(requestId: number, requestSchema: tlv.Schema<RequestT>, responseId: number, responseSchema: tlv.Schema<ResponseT>): OptionalCommand<RequestT, ResponseT> => ({ optional: true, requestId, requestSchema, responseId, responseSchema });

/* Interfaces and helper methods to define a cluset event */
export const enum EventPriority {
    Critical,
    Info,
}
export interface Event<T> { id: number, schema: tlv.Schema<T>, priority: EventPriority, optional: boolean }
export interface OptionalEvent<T> extends Event<T> { optional: true }
export const Event = <FT extends tlv.Fields>(id: number, priority: EventPriority, data: FT = <FT>{}): Event<tlv.TypeFromFields<FT>> => ({ id, schema: tlv.Object(data), priority, optional: false });
export const OptionalEvent = <FT extends tlv.Fields>(id: number, priority: EventPriority, data: FT = <FT>{}): Event<tlv.TypeFromFields<FT>> => ({ id, schema: tlv.Object(data), priority, optional: true });

/* Interfaces and helper methods to define a cluster */
export interface Attributes { [key: string]: Attribute<any> }
export interface Commands { [key: string]: Command<any, any> }
export interface Events { [key: string]: Event<any> }

/** @see {@link spec.MatterCoreSpecificationV1_0} § 7.13 */
export type GlobalAttributes<F extends schema.BitSchema> = {
    /** Indicates the revision of the server cluster specification supported by the cluster instance. */
    clusterRevision: Attribute<number>,

    /** Indicates whether the server supports zero or more optional clus­ter features. */
    featureMap: Attribute<schema.TypeFromBitSchema<F>>,
}
export const GlobalAttributes = <F extends schema.BitSchema>(features: F) => ({
    clusterRevision: Attribute(0xFFFD, tlv.UInt16),
    featureMap: Attribute(0xFFFC, tlv.Bitmap(features)),
} as GlobalAttributes<F>);

export interface Cluster<F extends schema.BitSchema, A extends Attributes, C extends Commands, E extends Events> {
    id: number,
    name: string,
    revision: number,
    features: schema.BitSchema,
    attributes: A,
    commands: C,
    events: E,
}
export const Cluster = <F extends schema.BitSchema, A extends Attributes, C extends Commands, E extends Events>({
    id,
    name,
    revision,
    features = <F>{},
    attributes = <A>{},
    commands = <C>{},
    events = <E>{},
}: {
    id: number,
    name: string,
    revision: number,
    features?: F,
    attributes?: A,
    commands?: C,
    events?: E,
} ):Cluster<F, Merge<A, GlobalAttributes<F>>, C, E> => ({
    id,
    name,
    revision,
    features,
    commands,
    attributes: Merge(attributes, GlobalAttributes(features)),
    events,
});
