import { Attribute, Attributes, Command, Commands, AttributeJsType, WritableAttribute, OptionalAttribute } from "../Cluster";

type SignatureFromCommandSpec<Type> = Type extends Command<infer RequestT, infer ResponseT> ? (request: RequestT) => Promise<ResponseT> : never;

type GetterTypeFromSpec<Spec extends Attribute<any>> = Spec extends OptionalAttribute<infer T> ? (T | undefined) : AttributeJsType<Spec>;
type AttributeGetters<Specs extends Attributes> = { [P in keyof Specs as `get${Capitalize<string & P>}`]: () => Promise<GetterTypeFromSpec<Specs[P]>> };

type WrittableAttributeNames<Specs extends Attributes> = {[K in keyof Specs]: Specs[K] extends WritableAttribute<any> ? K : never}[keyof Specs];
type AttributeSetters<Specs extends Attributes> = { [P in WrittableAttributeNames<Specs> as `set${Capitalize<string & P>}`]: AttributeJsType<Specs[P]> }

export type ClusterClient<CommandsT extends Commands, AttributesT extends Attributes> = 
    AttributeGetters<AttributesT>
    & AttributeSetters<AttributesT>
    & { [P in keyof AttributesT as `subscribe${Capitalize<string & P>}`]: () => Promise<void> }
    & { [P in keyof CommandsT]: SignatureFromCommandSpec<CommandsT[P]> };

