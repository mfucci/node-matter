import { MatterDevice } from "../../MatterDevice";
import { Session } from "../../session/Session";
import { AttributeSpecs, ClusterSpec, CommandSpec, CommandSpecs, TypeFromAttributeSpec } from "../ClusterSpec";
import { Attribute } from "./Attribute";

export type Attributes<T extends AttributeSpecs> = { [P in keyof T]: Attribute<TypeFromAttributeSpec<T[P]>> };
export type AttributeValues<T extends AttributeSpecs> = { [P in keyof T]: TypeFromAttributeSpec<T[P]> };
type CommandHandler<Type, Attributes> = Type extends CommandSpec<infer RequestT, infer ResponseT> ? (args: { request: RequestT, attributes: Attributes, session: Session<MatterDevice> }) => Promise<ResponseT> : never;
type CommandHandlers<T extends CommandSpecs, Attributes> = { [P in keyof T]: CommandHandler<T[P], Attributes> };
export type ClusterServerHandlers<C extends ClusterSpec<any, any>> = CommandHandlers<C["commands"], Attributes<C["attributes"]>>;
