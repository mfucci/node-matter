import { AttributeSpecs, CommandSpec, CommandSpecs, TypeFromAttributeSpec } from "../ClusterSpec";

type SignatureFromCommandSpec<Type> = Type extends CommandSpec<infer RequestT, infer ResponseT> ? (request: RequestT) => Promise<ResponseT> : never;
export type ClusterClient<CommandsT extends CommandSpecs, AttributesT extends AttributeSpecs> = 
    { [P in keyof AttributesT as `get${Capitalize<string & P>}`]: () => Promise<TypeFromAttributeSpec<AttributesT[P]>> }
    & { [P in keyof AttributesT as `set${Capitalize<string & P>}`]: (value: TypeFromAttributeSpec<AttributesT[P]>) => Promise<void> }
    & { [P in keyof AttributesT as `subscribe${Capitalize<string & P>}`]: () => Promise<void> }
    & { [P in keyof CommandsT]: SignatureFromCommandSpec<CommandsT[P]> };

