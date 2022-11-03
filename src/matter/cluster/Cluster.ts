/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { FieldModels, ObjectT, DataModel, JsTypeFromFields } from "../../codec/DataModels";

export const enum AccessLevel {
    View,
    Manage,
    Administer,
}

/* Interfaces and helper methods to define a cluster attribute */
export interface Attribute<T> { id: number, template: DataModel<T>, optional: boolean, readAcl: AccessLevel, writable: boolean, writeAcl?: AccessLevel, default?: T }
export interface OptionalAttribute<T> extends Attribute<T> { optional: true }
export interface WritableAttribute<T> extends Attribute<T> { writable: true }
export interface OptionalWritableAttribute<T> extends OptionalAttribute<T> { writable: true }
export type AttributeJsType<T extends Attribute<any>> = T extends Attribute<infer JsType> ? JsType : never;
interface AttributeOptions<T> { default?: T, readAcl?: AccessLevel, writeAcl?: AccessLevel };
export const Attribute = <T, V extends T>(id: number, template: DataModel<T>, { default: conformanceValue, readAcl = AccessLevel.View }: AttributeOptions<V> = {}): Attribute<T> => ({ id, template, optional: false, writable: false, default: conformanceValue, readAcl });
export const OptionalAttribute = <T, V extends T>(id: number, template: DataModel<T>, { default: conformanceValue, readAcl = AccessLevel.View }: AttributeOptions<V> = {}): OptionalAttribute<T> => ({ id, template, optional: true, writable: false, default: conformanceValue, readAcl });
export const WritableAttribute = <T, V extends T>(id: number, template: DataModel<T>, { default: conformanceValue, readAcl = AccessLevel.View, writeAcl = AccessLevel.View }: AttributeOptions<V> = {}): WritableAttribute<T> => ({ id, template, optional: false, writable: true, default: conformanceValue, readAcl, writeAcl });
export const OptionalWritableAttribute = <T, V extends T>(id: number, template: DataModel<T>, { default: conformanceValue, readAcl = AccessLevel.View, writeAcl = AccessLevel.View }: AttributeOptions<V> = {}): WritableAttribute<T> => ({ id, template, optional: true, writable: true, default: conformanceValue, readAcl, writeAcl });

/* Interfaces and helper methods to define a cluster command */
export const NoArgumentsT = ObjectT({});
export const NoResponseT = <DataModel<void>>{};
export interface Command<RequestT, ResponseT> { optional: boolean, requestId: number, requestTemplate: DataModel<RequestT>, responseId: number, responseTemplate: DataModel<ResponseT> };
export interface OptionalCommand<RequestT, ResponseT> extends Command<RequestT, ResponseT> { optional: true };
export type ResponseType<T extends Command<any, any>> = T extends OptionalCommand<any, infer ResponseT> ? ResponseT | undefined : (T extends Command<any, infer ResponseT> ? ResponseT : never);
export type RequestType<T extends Command<any, any>> = T extends Command<infer RequestT, any> ? RequestT : never;
export const Command = <RequestT, ResponseT>(requestId: number, requestTemplate: DataModel<RequestT>, responseId: number, responseTemplate: DataModel<ResponseT>): Command<RequestT, ResponseT> => ({ optional: false, requestId, requestTemplate, responseId, responseTemplate });
export const OptionalCommand = <RequestT, ResponseT>(requestId: number, requestTemplate: DataModel<RequestT>, responseId: number, responseTemplate: DataModel<ResponseT>): OptionalCommand<RequestT, ResponseT> => ({ optional: true, requestId, requestTemplate, responseId, responseTemplate });

/* Interfaces and helper methods to define a cluset event */
export const enum EventPriority {
    Critical,
    Info,
}
export interface Event<T> { id: number, template: DataModel<T>, priority: EventPriority, optional: boolean }
export interface OptionalEvent<T> extends Event<T> { optional: true }
export const Event = <FT extends FieldModels>(id: number, priority: EventPriority, data: FT = <FT>{}): Event<JsTypeFromFields<FT>> => ({ id, template: ObjectT(data), priority, optional: false });
export const OptionalEvent = <FT extends FieldModels>(id: number, priority: EventPriority, data: FT = <FT>{}): Event<JsTypeFromFields<FT>> => ({ id, template: ObjectT(data), priority, optional: true });

/* Interfaces and helper methods to define a cluster */
export interface Attributes { [key: string]: Attribute<any> }
export interface Commands { [key: string]: Command<any, any> }
export interface Events { [key: string]: Event<any> }
export interface Cluster<C extends Commands, A extends Attributes, E extends Events> { id: number, name: string, commands: C, attributes: A, events: E }
export const Cluster = <C extends Commands, A extends Attributes, E extends Events>({id, name, attributes = <A>{}, commands = <C>{}, events = <E>{} }: { id: number, name: string, attributes?: A, commands?: C, events?: E } ):Cluster<C, A, E> => ({ id, name, commands, attributes, events });
