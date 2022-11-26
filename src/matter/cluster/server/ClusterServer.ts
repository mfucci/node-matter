/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Merge } from "../../../util/Type";
import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { Cluster, Command, Commands, AttributeJsType, Attributes, Attribute, OptionalAttribute, OptionalCommand, OptionalWritableAttribute, WritableAttribute, GlobalAttributes } from "../Cluster";
import { AttributeServer } from "./AttributeServer";

type MandatoryAttributeNames<A extends Attributes> = {[K in keyof A]: A[K] extends OptionalAttribute<any> ? never : K}[keyof A];
type OptionalAttributeNames<A extends Attributes> = {[K in keyof A]: A[K] extends OptionalAttribute<any> ? K : never}[keyof A];
/** Cluster attributes accessible on the cluster server */
export type AttributeServers<A extends Attributes> = { [P in MandatoryAttributeNames<A>]: AttributeServer<AttributeJsType<A[P]>> };
/** Initial values for the cluster attribute */
export type AttributeInitialValues<A extends Attributes> = Merge<Omit<{ [P in MandatoryAttributeNames<A>]: AttributeJsType<A[P]> }, keyof GlobalAttributes<any>>, { [P in OptionalAttributeNames<A>]?: AttributeJsType<A[P]> }>;

type MandatoryCommandNames<C extends Commands> = {[K in keyof C]: C[K] extends OptionalCommand<any, any> ? never : K}[keyof C];
type OptionalCommandNames<C extends Commands> = {[K in keyof C]: C[K] extends OptionalCommand<any, any> ? K : never}[keyof C];
type CommandHandler<C extends Command<any, any>, A extends AttributeServers<any>> = C extends Command<infer RequestT, infer ResponseT> ? (args: { request: RequestT, attributes: A, session: Session<MatterDevice> }) => Promise<ResponseT> : never;
type CommandHandlers<T extends Commands, A extends AttributeServers<any>> = Merge<{ [P in MandatoryCommandNames<T>]: CommandHandler<T[P], A> }, { [P in OptionalCommandNames<T>]?: CommandHandler<T[P], A> }>;

/** Handlers to process cluster commands */
export type ClusterServerHandlers<C extends Cluster<any, any, any, any>> = CommandHandlers<C["commands"], AttributeServers<C["attributes"]>>;

type OptionalAttributeConf<T extends Attributes> = { [K in OptionalAttributeNames<T>]?: true };
type MakeAttributeMandatory<A extends Attribute<any>> = A extends OptionalWritableAttribute<infer T> ? WritableAttribute<T> : (A extends OptionalAttribute<infer T> ? Attribute<T> : A);
type MakeAttributesMandatory<T extends Attributes, C extends OptionalAttributeConf<T>> = {[K in keyof T]: K extends keyof C ? MakeAttributeMandatory<T[K]> : T[K]};

const MakeAttributesMandatory = <T extends Attributes, C extends OptionalAttributeConf<T>>(attributes: T, conf: C): MakeAttributesMandatory<T, C> => {
    const result = <Attributes>{ ...attributes };
    for (const key in conf) {
        (result as any)[key] = { ...result[key], optional: false };
    }
    return result as MakeAttributesMandatory<T, C>;
};
type UseOptionalAttributes<C extends Cluster<any, any, any, any>, A extends OptionalAttributeConf<C["attributes"]>> = Cluster<C["features"], MakeAttributesMandatory<C["attributes"], A>, C["commands"], C["events"]>;
/** Forces the presence of the specified optional attributes, so they can be used in the command handlers */
export const UseOptionalAttributes = <C extends Cluster<any, any, any, any>, A extends OptionalAttributeConf<C["attributes"]>>(cluster: C, conf: A): UseOptionalAttributes<C, A> => ({ ...cluster, attributes: MakeAttributesMandatory(cluster.attributes, conf) });
