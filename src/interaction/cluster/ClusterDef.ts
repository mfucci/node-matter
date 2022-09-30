/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Template } from "../../codec/TlvObjectCodec";

export interface AttributeDef<ValueT> { id: number, template: Template<ValueT> }
export const AttributeDef = <T,>(id: number, template: Template<T>): AttributeDef<T> => ({ id, template });
type TypeOfAttribute<Type> = Type extends AttributeDef<infer T> ? T : never;
export type AttributeDefs = { [key: string]: AttributeDef<any> };

export interface CommandDef<RequestT, ResponseT> { requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT> };
export const CommandDef = <RequestT, ResponseT>(requestId: number, requestTemplate: Template<RequestT>, responseId: number, responseTemplate: Template<ResponseT>): CommandDef<RequestT, ResponseT> => ({ requestId, requestTemplate, responseId, responseTemplate });
type CommandAsyncSignature<Type> = Type extends CommandDef<infer RequestT, infer ResponseT> ? (request: RequestT) => Promise<ResponseT> : never;
export type CommandDefs = { [key: string]: CommandDef<any, any> };

export type ClusterDef<CommandT extends CommandDefs, AttributeT extends AttributeDefs> = { id: number, name: string, commands: CommandT, attributes: AttributeT };
export const ClusterDef = <CommandT extends CommandDefs, AttributeT extends AttributeDefs>(id: number, name: string, attributes: AttributeT, commands: CommandT):ClusterDef<CommandT, AttributeT> => ({ id, name, commands, attributes });

type AttributeAsyncAccessors<T extends AttributeDefs> =
    { [P in keyof T as `get${Capitalize<string & P>}`]: () => Promise<TypeOfAttribute<T[P]>> }
    & { [P in keyof T as `set${Capitalize<string & P>}`]: (value: TypeOfAttribute<T[P]>) => Promise<void> }
    & { [P in keyof T as `subscribe${Capitalize<string & P>}`]: () => Promise<void> };
type CommandAsyncSignatures<T extends CommandDefs> = { [P in keyof T]: CommandAsyncSignature<T[P]> };
export type ClusterClient<C extends ClusterDef<any, any>> = AttributeAsyncAccessors<C["attributes"]> & CommandAsyncSignatures<C["commands"]>;
