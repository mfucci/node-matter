import { TlvType } from "../codec/TlvCodec";
import { AnyT, ArrayT, BooleanT, Field, JsType, ObjectT, OptionalField, UnsignedIntT } from "../codec/TlvObjectCodec";

export const ReadRequestT = ObjectT({
    attributes: Field(0, ArrayT(ObjectT({
        endpointId: OptionalField(2, UnsignedIntT),
        clusterId: Field(3, UnsignedIntT),
        attributeId: Field(4, UnsignedIntT),
    }, TlvType.List))),
    isFabricFiltered: Field(3, BooleanT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

export const ReadResponseT = ObjectT({
    values: Field(1, ArrayT(ObjectT({
        value: Field(1, ObjectT({
            version: Field(0, UnsignedIntT),
            path: Field(1, ObjectT({
                endpointId: Field(2, UnsignedIntT),
                clusterId: Field(3, UnsignedIntT),
                attributeId: Field(4, UnsignedIntT),
            }, TlvType.List)),
            value: Field(2, AnyT),
        })),
    }))),
    isFabricFiltered: Field(4, BooleanT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

const CommandPathT = ObjectT({
    endpointId: Field(0, UnsignedIntT),
    clusterId: Field(1, UnsignedIntT),
    commandId: Field(2, UnsignedIntT),
}, TlvType.List);

export const InvokeRequestT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    timedRequest: Field(1, BooleanT),
    invokes: Field(2, ArrayT(ObjectT({
        path: Field(0, CommandPathT),
        args: Field(1, AnyT),
    }))),
});

export const InvokeResponseT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    responses: Field(1, ArrayT(ObjectT({
        response: Field(0, ObjectT({
            path: Field(0, CommandPathT),
            response: Field(1, AnyT),
        })),
    }))),
});
