/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ObjectT, Template } from "../../codec/TlvObjectCodec";

export interface AttributeSpec<ValueT> { id: number, template: Template<ValueT>, defaultValue?: ValueT }
export const AttributeSpec = <T,>(id: number, template: Template<T>, defaultValue?: T): AttributeSpec<T> => ({ id, template, defaultValue });
export type TypeFromAttributeSpec<Type> = Type extends AttributeSpec<infer T> ? T : never;
export type AttributeSpecs = { [key: string]: AttributeSpec<any> };

export interface CommandSpec<RequestT, ResponseT> { requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT> };
export const CommandSpec = <RequestT, ResponseT>(requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT>): CommandSpec<RequestT, ResponseT> => ({ requestId, requestTemplate, responseId, responseTemplate });
export type CommandSpecs = { [key: string]: CommandSpec<any, any> };
export const NoArgumentsT = ObjectT({});
export const NoResponseT: Template<void> = {};

export type ClusterSpec<CommandT extends CommandSpecs, AttributeT extends AttributeSpecs> = { id: number, name: string, commands: CommandT, attributes: AttributeT };
export const ClusterSpec = <CommandT extends CommandSpecs, AttributeT extends AttributeSpecs>(id: number, name: string, attributes: AttributeT, commands: CommandT):ClusterSpec<CommandT, AttributeT> => ({ id, name, commands, attributes });
