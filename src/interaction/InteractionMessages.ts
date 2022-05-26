import { PrimitiveType} from "../codec/TlvCodec";
import { ArrayTemplate, Field, ObjectTemplate, OptionalField, RawElementTemplate } from "../codec/TlvObjectCodec";
import { Tag } from "../models/Tag";

const { UnsignedInt, Boolean, List } = PrimitiveType;

export interface AttributePath {
    endpointId?: number,
    clusterId: number,
    attributeId: number,
}

const AttributePathTemplate = ObjectTemplate<AttributePath>({
    endpointId: OptionalField(2, UnsignedInt),
    clusterId: Field(3, UnsignedInt),
    attributeId: Field(4, UnsignedInt),
}, Tag.Anonymous, List);

export interface ReadRequest {
    attributes: AttributePath[],
    isFabricFiltered: boolean,
    interactionModelRevision: number,
}

export const ReadRequestTemplate = ObjectTemplate<ReadRequest>({
    attributes: Field(0, ArrayTemplate(AttributePathTemplate)),
    isFabricFiltered: Field(3, Boolean),
    interactionModelRevision: Field(0xFF, UnsignedInt),
});

interface AttributeValue {
    version: number,
    path: AttributePath,
    value: any,
}

interface AttributeReport {
    value: AttributeValue,
}

export interface ReadResponse {
    values: AttributeReport[],
    isFabricFiltered: boolean,
    interactionModelRevision: number,
}

export const ReadResponseTemplate = ObjectTemplate<ReadResponse>({
    values: Field(1, ArrayTemplate(ObjectTemplate<AttributeReport>({
        value: Field(1, ObjectTemplate<AttributeValue>({
            version: OptionalField(0, UnsignedInt),
            path: Field(1, AttributePathTemplate),
            value: Field(2, RawElementTemplate),
        })),
    }))),
    isFabricFiltered: Field(4, Boolean),
    interactionModelRevision: Field(0xFF, UnsignedInt),
});

export interface CommandPath {
    endpointId: number,
    clusterId: number,
    commandId: number,
}

const InvokePathTemplate = ObjectTemplate<CommandPath>({
    endpointId: OptionalField(0, UnsignedInt),
    clusterId: Field(1, UnsignedInt),
    commandId: Field(2, UnsignedInt),
}, Tag.Anonymous, List);

interface Invoke {
    path: CommandPath,
    args: any,
}

export interface InvokeRequest {
    suppressResponse: boolean,
    timedRequest: boolean,
    invokes: Invoke[],
}

interface Response {
    path: CommandPath,
    response: any,
}

interface InvokeReport {
    response: Response,
}

export interface InvokeResponse {
    suppressResponse: boolean,
    responses: InvokeReport[],
}

export const InvokeRequestTemplate = ObjectTemplate<InvokeRequest>({
    suppressResponse: Field(0, Boolean),
    timedRequest: Field(1, Boolean),
    invokes: Field(2, ArrayTemplate(ObjectTemplate<Invoke>({
        path: Field(0, InvokePathTemplate),
        args: Field(1, RawElementTemplate),
    }))),
});

export const InvokeResponseTemplate = ObjectTemplate<InvokeResponse>({
    suppressResponse: Field(0, Boolean),
    responses: Field(1, ArrayTemplate(ObjectTemplate<InvokeReport>({
        response: Field(0, ObjectTemplate<Response>({
            path: Field(0, InvokePathTemplate),
            response: Field(1, RawElementTemplate),
        })),
    }))),
});
