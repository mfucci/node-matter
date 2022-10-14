/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ObjectT, Template } from "../../codec/TlvObjectCodec";

export interface AttributeOptions<ValueT> { optional: boolean, writable: boolean, conformanceValue?: ValueT }
export interface Attribute<ValueT> extends AttributeOptions<ValueT> { id: number, template: Template<ValueT> }
export interface OptionalAttribute<ValueT> extends Attribute<ValueT> { optional: true };
export interface WritableAttribute<ValueT> extends Attribute<ValueT> { writable: true };

export const Attribute = <T,>(id: number, template: Template<T>, conformanceValue?: T): Attribute<T> => ({ id, template, optional: false, writable: false, conformanceValue });
export const OptionalAttribute = <T,>(id: number, template: Template<T>): OptionalAttribute<T> => ({ id, template, optional: true, writable: false });
export const WritableAttribute = <T,>(id: number, template: Template<T>): WritableAttribute<T> => ({ id, template, optional: false, writable: true });
export type AttributeJsType<Type> = Type extends Attribute<infer T> ? T : never;
export type Attributes = { [key: string]: Attribute<any> };

export interface Command<RequestT, ResponseT> { requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT> };
export const Command = <RequestT, ResponseT>(requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT>): Command<RequestT, ResponseT> => ({ requestId, requestTemplate, responseId, responseTemplate });
export type Commands = { [key: string]: Command<any, any> };
export const NoArgumentsT = ObjectT({});
export const NoResponseT: Template<void> = {};

export type Cluster<CommandT extends Commands, AttributeT extends Attributes> = { id: number, name: string, commands: CommandT, attributes: AttributeT };
export const Cluster = <CommandT extends Commands, AttributeT extends Attributes>(id: number, name: string, attributes: AttributeT, commands: CommandT):Cluster<CommandT, AttributeT> => ({ id, name, commands, attributes });
