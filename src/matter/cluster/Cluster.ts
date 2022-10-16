/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ObjectT, Template } from "../../codec/TlvObjectCodec";

/* Interfaces and helper methods to define a cluster attribute */
export interface Attribute<T> { id: number, template: Template<T>, optional: boolean, writable: boolean, conformanceValue?: T }
export interface OptionalAttribute<T> extends Attribute<T> { optional: true }
export interface WritableAttribute<T> extends Attribute<T> { writable: true }
export interface OptionalWritableAttribute<T> extends OptionalAttribute<T> { writable: true }
export type AttributeJsType<T extends Attribute<any>> = T extends Attribute<infer JsType> ? JsType : never;
export const Attribute = <T,>(id: number, template: Template<T>, conformanceValue?: T): Attribute<T> => ({ id, template, optional: false, writable: false, conformanceValue });
export const OptionalAttribute = <T,>(id: number, template: Template<T>, conformanceValue?: T): OptionalAttribute<T> => ({ id, template, optional: true, writable: false, conformanceValue });
export const WritableAttribute = <T,>(id: number, template: Template<T>, conformanceValue?: T): WritableAttribute<T> => ({ id, template, optional: false, writable: true, conformanceValue });
export const OptionalWritableAttribute = <T,>(id: number, template: Template<T>, conformanceValue?: T): WritableAttribute<T> => ({ id, template, optional: true, writable: true, conformanceValue });

/* Interfaces and helper methods to define a cluster command */
export const NoArgumentsT = ObjectT({});
export const NoResponseT = <Template<void>>{};
export interface Command<RequestT, ResponseT> { requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT> };
export const Command = <RequestT, ResponseT>(requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT>): Command<RequestT, ResponseT> => ({ requestId, requestTemplate, responseId, responseTemplate });

/* Interfaces and helper methods to define a cluster */
export interface Attributes { [key: string]: Attribute<any> }
export interface Commands { [key: string]: Command<any, any> }
export interface Cluster<C extends Commands, A extends Attributes> { id: number, name: string, commands: C, attributes: A }
export const Cluster = <C extends Commands, A extends Attributes>(id: number, name: string, attributes: A, commands: C):Cluster<C, A> => ({ id, name, commands, attributes });
