import { Attribute, Attributes, Command, Commands, AttributeJsType, WritableAttribute, OptionalAttribute, OptionalWritableAttribute } from "../Cluster";

type SignatureFromCommandSpec<T> = T extends Command<infer RequestT, infer ResponseT> ? (request: RequestT) => Promise<ResponseT> : never;
type GetterTypeFromSpec<A extends Attribute<any>> = A extends OptionalAttribute<infer T> ? (T | undefined) : AttributeJsType<A>;
type AttributeGetters<A extends Attributes> = { [P in keyof A as `get${Capitalize<string & P>}`]: () => Promise<GetterTypeFromSpec<A[P]>> };
type WrittableAttributeNames<A extends Attributes> = {[K in keyof A]: A[K] extends WritableAttribute<any> ? K : never}[keyof A] | {[K in keyof A]: A[K] extends OptionalWritableAttribute<any> ? K : never}[keyof A];
type AttributeSetters<A extends Attributes> = { [P in WrittableAttributeNames<A> as `set${Capitalize<string & P>}`]: AttributeJsType<A[P]> }

/** Strongly typed interface of a cluster client */
export type ClusterClient<CommandsT extends Commands, AttributesT extends Attributes> = 
    AttributeGetters<AttributesT>
    & AttributeSetters<AttributesT>
    & { [P in keyof AttributesT as `subscribe${Capitalize<string & P>}`]: () => Promise<void> }
    & { [P in keyof CommandsT]: SignatureFromCommandSpec<CommandsT[P]> };
