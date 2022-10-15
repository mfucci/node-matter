import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { Cluster, Command, Commands, AttributeJsType, Attributes, Attribute, OptionalAttribute } from "../Cluster";
import { AttributeServer } from "./AttributeServer";

type MandatoryAttributeNames<A extends Attributes> = {[K in keyof A]: A[K] extends OptionalAttribute<any> ? never : K}[keyof A];
type OptionalAttributeNames<A extends Attributes> = {[K in keyof A]: A[K] extends OptionalAttribute<any> ? K : never}[keyof A];
/** Cluster attributes accessible on the cluster server */
export type AttributeServers<A extends Attributes> = { [P in MandatoryAttributeNames<A>]: AttributeServer<AttributeJsType<A[P]>> };
/** Initial values for the cluster attribute */
export type AttributeInitialValues<A extends Attributes> = { [P in MandatoryAttributeNames<A>]: AttributeJsType<A[P]> } & { [P in OptionalAttributeNames<A>]?: AttributeJsType<A[P]> };

type CommandHandler<C extends Command<any, any>, A extends AttributeServers<any>> = C extends Command<infer RequestT, infer ResponseT> ? (args: { request: RequestT, attributes: A, session: Session<MatterDevice> }) => Promise<ResponseT> : never;
type CommandHandlers<T extends Commands, A extends AttributeServers<any>> = { [P in keyof T]: CommandHandler<T[P], A> };
/** Handlers to process cluster commands */
export type ClusterServerHandlers<C extends Cluster<any, any>> = CommandHandlers<C["commands"], AttributeServers<C["attributes"]>>;

type OptionalAttributeConf<T extends Attributes> = { [K in OptionalAttributeNames<T>]?: true };
type MakeAttributesMandatory<T extends Attributes, C extends OptionalAttributeConf<T>> = Omit<T, keyof C> & { [ K in Extract<keyof T, keyof C>]: Attribute<AttributeJsType<T[K]>> };
const MakeAttributesMandatory = <T extends Attributes, C extends OptionalAttributeConf<T>>(attributes: T, conf: C): MakeAttributesMandatory<T, C> => {
    const result = { ...attributes };
    for (const key in conf) {
        (result as any)[key] = { ...result[key], optional: false };
    }
    return result;
};
type UseOptionalAttributes<C extends Cluster<any, any>, A extends OptionalAttributeConf<C["attributes"]>> = Cluster<C["commands"], MakeAttributesMandatory<C["attributes"], A>>;
/** Forces the presence of the specified optional attributes, so they can be used in the command handlers */
export const UseOptionalAttributes = <C extends Cluster<any, any>, A extends OptionalAttributeConf<C["attributes"]>>(cluster: C, conf: A): UseOptionalAttributes<C, A> => ({ ...cluster, attributes: MakeAttributesMandatory(cluster.attributes, conf) });