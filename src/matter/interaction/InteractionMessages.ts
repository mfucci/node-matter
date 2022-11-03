/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvType } from "../../codec/TlvCodec";
import { AnyT, ArrayT, BooleanT, EnumT, Field, ObjectT, OptionalField, UInt16T, UInt32T, UInt64T, UInt8T } from "../../codec/TlvObjectCodec";
import { NodeIdT } from "../common/NodeId";

/**
 * @see [Matter Core Specification R1.0], section 8.10
 */
export const enum StatusCode {
    Success = 0x00,
    Failure = 0x01,
    InvalidSubscription = 0x7d,
    UnsupportedAccess = 0x7e, // old name: NOT_AUTHORIZED
    UnsupportedEndpoint = 0x7f,
    InvalidAction = 0x80,
    UnsupportedCommand = 0x81,// old name: UNSUP_COMMAND
    InvalidCommand = 0x85, // old name INVALID_FIELD
    UnsupportedAttribute = 0x86,
    ConstraintError = 0x87, // old name INVALID_VALUE
    UnsupportedWrite = 0x88, // old name READ_ONLY
    ResourceExhausted = 0x89, // old name INSUFFICIENT_SPACE
    NotFound = 0x8b,
    UnreportableAttribute = 0x8c,
    InvalidDataType = 0x8d,
    UnsupportedRead = 0x8f,
    DataVersionMismatch = 0x92,
    Timeout = 0x94,
    UnsupportedMode = 0x9b,
    Busy = 0x9c,
    UnsupportedCluster = 0xc3,
    NoUpstreamSubscription = 0xc5,
    NeedsTimedInteraction = 0xc6,
    UnsupportedEvent = 0xc7,
    PathsExhausted = 0xc8,
    TimedRequestMismatch = 0xc9,
    FailsafeRequired = 0xca,
}
export const StatusResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    interactionModelRevision: Field(0xFF, UInt8T),
});

const AttributePathT = ObjectT({
    endpointId: OptionalField(2, UInt16T),
    clusterId: OptionalField(3, UInt32T),
    id: OptionalField(4, UInt32T),
}, TlvType.List);

export const ReadRequestT = ObjectT({
    attributes: Field(0, ArrayT(AttributePathT)),
    isFabricFiltered: Field(3, BooleanT),
    interactionModelRevision: Field(0xFF, UInt8T),
});

export const DataReportT = ObjectT({
    subscriptionId: OptionalField(0, UInt32T),
    values: Field(1, ArrayT(ObjectT({
        value: Field(1, ObjectT({
            version: Field(0, UInt32T),
            path: Field(1, ObjectT({
                endpointId: Field(2, UInt16T),
                clusterId: Field(3, UInt32T),
                id: Field(4, UInt32T),
            }, TlvType.List)),
            value: Field(2, AnyT),
        })),
    }))),
    isFabricFiltered: OptionalField(4, BooleanT),
    interactionModelRevision: Field(0xFF, UInt8T),
});

export const SubscribeRequestT = ObjectT({
    keepSubscriptions: Field(0, BooleanT),
    minIntervalFloorSeconds: Field(1, UInt16T),
    maxIntervalCeilingSeconds: Field(2, UInt16T),
    attributeRequests: OptionalField(3, ArrayT(AttributePathT)),
    eventRequests: OptionalField(4, ArrayT(ObjectT({
        node: Field(0, NodeIdT),
        endpoint: Field(1, UInt16T),
        cluster: Field(2, UInt32T),
        event: Field(3, UInt32T),
        isUrgent: Field(4, BooleanT),
    }, TlvType.List))),
    eventFilters: OptionalField(5, ArrayT(ObjectT({
        node: Field(0, NodeIdT),
        eventMin: Field(1, UInt64T),
    }, TlvType.List))),
    isFabricFiltered: Field(7, BooleanT),
    dataVersionFilters: OptionalField(8, ArrayT(ObjectT({
        path: Field(0, ObjectT({
            node: Field(0, NodeIdT),
            endpoint: Field(1, UInt16T),
            cluster: Field(2, UInt32T),
        }, TlvType.List)),
        dataVersion: Field(1, UInt32T),
    }))),
});

export const SubscribeResponseT = ObjectT({
    subscriptionId: Field(0, UInt32T),
    maxIntervalCeilingSeconds: Field(2, UInt16T),
    interactionModelRevision: Field(0xFF, UInt8T),
});

export const InvokeRequestT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    timedRequest: Field(1, BooleanT),
    invokes: Field(2, ArrayT(ObjectT({
        path: Field(0, ObjectT({
            endpointId: Field(0, UInt16T),
            clusterId: Field(1, UInt32T),
            id: Field(2, UInt32T),
        }, TlvType.List)),
        args: Field(1, AnyT),
    }))),
});

export const InvokeResponseT = ObjectT({
    suppressResponse: Field(0, BooleanT),
    responses: Field(1, ArrayT(ObjectT({
        response: OptionalField(0, ObjectT({
            path: Field(0, ObjectT({
                endpointId: Field(0, UInt16T),
                clusterId: Field(1, UInt32T),
                id: Field(2, UInt32T),
            }, TlvType.List)),
            response: Field(1, AnyT),
        })),
        result: OptionalField(1, ObjectT({
            path: Field(0, ObjectT({
                endpointId: Field(0, UInt16T),
                clusterId: Field(1, UInt32T),
                id: Field(2, UInt32T),
            }, TlvType.List)),
            result: Field(1, ObjectT({
                code: Field(0, UInt16T),
            })),
        })),
    }))),
    interactionModelRevision: Field(0xFF, UInt8T),
});
