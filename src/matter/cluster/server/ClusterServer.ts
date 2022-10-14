import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { Cluster, Command, Commands, AttributeJsType, Attributes, Attribute, OptionalAttribute } from "../Cluster";
import { AttributeServer } from "./AttributeServer";


type MandatoryAttributeNames<T extends Attributes> = {[K in keyof T]: T[K] extends OptionalAttribute<any> ? never : K}[keyof T];
export type OptionalAttributeNames<T extends Attributes> = {[K in keyof T]: T[K] extends OptionalAttribute<any> ? K : never}[keyof T];
export type AttributeServers<T extends Attributes> = { [P in MandatoryAttributeNames<T>]: AttributeServer<AttributeJsType<T[P]>> };
export type AttributeInitialValues<ClusterAttributes extends Attributes> =
    { [P in MandatoryAttributeNames<ClusterAttributes>]: AttributeJsType<ClusterAttributes[P]> }
    & { [P in OptionalAttributeNames<ClusterAttributes>]?: AttributeJsType<ClusterAttributes[P]> };
type CommandHandler<Type, Attributes> = Type extends Command<infer RequestT, infer ResponseT> ? (args: { request: RequestT, attributes: Attributes, session: Session<MatterDevice> }) => Promise<ResponseT> : never;
type CommandHandlers<T extends Commands, Attributes> = { [P in keyof T]: CommandHandler<T[P], Attributes> };

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
export type UseOptionalAttributes<C extends Cluster<any, any>, OptionalAttributes extends OptionalAttributeConf<C["attributes"]>> = Cluster<C["commands"], MakeAttributesMandatory<C["attributes"], OptionalAttributes>>;
export const UseOptionalAttributes = <C extends Cluster<any, any>, OptionalAttributes extends OptionalAttributeConf<C["attributes"]>>(cluster: C, conf: OptionalAttributes): UseOptionalAttributes<C, OptionalAttributes> => ({ ...cluster, attributes: MakeAttributesMandatory(cluster.attributes, conf) });