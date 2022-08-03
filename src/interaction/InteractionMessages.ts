/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvType } from "../codec/TlvCodec";
import { AnyT, ArrayT, BooleanT, Field, ObjectT, OptionalField, UnsignedIntT } from "../codec/TlvObjectCodec";

export const ReadRequestT = ObjectT({
    attributes: Field(0, ArrayT(ObjectT({
        endpointId: OptionalField(2, UnsignedIntT),
        clusterId: OptionalField(3, UnsignedIntT),
        attributeId: OptionalField(4, UnsignedIntT),
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

export const InvokeRequestT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    timedRequest: Field(1, BooleanT),
    invokes: Field(2, ArrayT(ObjectT({
        path: Field(0, ObjectT({
            endpointId: Field(0, UnsignedIntT),
            clusterId: Field(1, UnsignedIntT),
            commandId: Field(2, UnsignedIntT),
        }, TlvType.List)),
        args: Field(1, AnyT),
    }))),
});

export const InvokeResponseT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    responses: Field(1, ArrayT(ObjectT({
        response: OptionalField(0, ObjectT({
            path: Field(0, ObjectT({
                endpointId: Field(0, UnsignedIntT),
                clusterId: Field(1, UnsignedIntT),
                responseId: Field(2, UnsignedIntT),
            }, TlvType.List)),
            response: Field(1, AnyT),
        })),
        result: OptionalField(1, ObjectT({
            path: Field(0, ObjectT({
                endpointId: Field(0, UnsignedIntT),
                clusterId: Field(1, UnsignedIntT),
                commandId: Field(2, UnsignedIntT),
            }, TlvType.List)),
            result: Field(1, ObjectT({
                code: Field(0, UnsignedIntT),
            })),
        })),
    }))),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});
