/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvType } from "../../codec/TlvCodec";
import { AnyT, ArrayT, BooleanT, Field, ObjectT, OptionalField, Template, UnsignedIntT, UnsignedLongT } from "../../codec/TlvObjectCodec";

// See project-chip src/protocols/interaction_model/StatusCodeList.h
export const enum StatusCode {
    Success = 0x00,
    Failure = 0x01,
}
export const StatusCodeT = { tlvType: TlvType.UnsignedInt } as Template<StatusCode>;

export const StatusResponseT = ObjectT({
    status: Field(0, StatusCodeT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

const AttributePathT = ObjectT({
    endpointId: OptionalField(2, UnsignedIntT),
    clusterId: OptionalField(3, UnsignedIntT),
    id: OptionalField(4, UnsignedIntT),
}, TlvType.List);

export const ReadRequestT = ObjectT({
    attributes: Field(0, ArrayT(AttributePathT)),
    isFabricFiltered: Field(3, BooleanT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

export const DataReportT = ObjectT({
    subscriptionId: OptionalField(0, UnsignedIntT),
    values: Field(1, ArrayT(ObjectT({
        value: Field(1, ObjectT({
            version: Field(0, UnsignedIntT),
            path: Field(1, ObjectT({
                endpointId: Field(2, UnsignedIntT),
                clusterId: Field(3, UnsignedIntT),
                id: Field(4, UnsignedIntT),
            }, TlvType.List)),
            value: Field(2, AnyT),
        })),
    }))),
    isFabricFiltered: OptionalField(4, BooleanT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

export const SubscribeRequestT = ObjectT({
    keepSubscriptions: Field(0, BooleanT),
    minIntervalFloorSeconds: Field(1, UnsignedIntT),
    maxIntervalCeilingSeconds: Field(2, UnsignedIntT),
    attributeRequests: OptionalField(3, ArrayT(AttributePathT)),
    eventRequests: OptionalField(4, ArrayT(ObjectT({
        node: Field(0, UnsignedIntT),
        endpoint: Field(1, UnsignedIntT),
        cluster: Field(2, UnsignedIntT),
        event: Field(3, UnsignedIntT),
        isUrgent: Field(4, BooleanT),
    }, TlvType.List))),
    eventFilters: OptionalField(5, ArrayT(ObjectT({
        node: Field(0, UnsignedIntT),
        eventMin: Field(1, UnsignedLongT),
    }, TlvType.List))),
    isFabricFiltered: Field(7, BooleanT),
    dataVersionFilters: OptionalField(8, ArrayT(ObjectT({
        path: Field(0, ObjectT({
            node: Field(0, UnsignedIntT),
            endpoint: Field(1, UnsignedIntT),
            cluster: Field(2, UnsignedIntT),
        }, TlvType.List)),
        dataVersion: Field(1, UnsignedIntT),
    }))),
});

export const SubscribeResponseT = ObjectT({
    subscriptionId: Field(0, UnsignedIntT),
    maxIntervalCeilingSeconds: Field(2, UnsignedIntT),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});

export const InvokeRequestT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    timedRequest: Field(1, BooleanT),
    invokes: Field(2, ArrayT(ObjectT({
        path: Field(0, ObjectT({
            endpointId: Field(0, UnsignedIntT),
            clusterId: Field(1, UnsignedIntT),
            id: Field(2, UnsignedIntT),
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
                id: Field(2, UnsignedIntT),
            }, TlvType.List)),
            response: Field(1, AnyT),
        })),
        result: OptionalField(1, ObjectT({
            path: Field(0, ObjectT({
                endpointId: Field(0, UnsignedIntT),
                clusterId: Field(1, UnsignedIntT),
                id: Field(2, UnsignedIntT),
            }, TlvType.List)),
            result: Field(1, ObjectT({
                code: Field(0, UnsignedIntT),
            })),
        })),
    }))),
    interactionModelRevision: Field(0xFF, UnsignedIntT),
});
