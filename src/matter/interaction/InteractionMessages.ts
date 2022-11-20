/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvType } from "../../codec/TlvCodec";
import { AnyT, ArrayT,  tlv.Boolean, EnumT, Field, ObjectT, OptionalField, tlv.UInt16, tlv.UInt32, UInt64T, tlv.UInt8 } from "../../codec/TlvObjectCodec";
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
export const StatusResponseT = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

const AttributePathT = tlv.Object({
    endpointId: tlv.OptionalField(2, tlv.UInt16),
    clusterId: tlv.OptionalField(3, tlv.UInt32),
    id: tlv.OptionalField(4, tlv.UInt32),
}, TlvType.List);

export const ReadRequestT = tlv.Object({
    attributes: tlv.Field(0, tlv.Array(AttributePathT)),
    isFabricFiltered: tlv.Field(3,  tlv.Boolean),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const DataReportT = tlv.Object({
    subscriptionId: tlv.OptionalField(0, tlv.UInt32),
    values: tlv.Field(1, tlv.Array(tlv.Object({
        value: tlv.Field(1, tlv.Object({
            version: tlv.Field(0, tlv.UInt32),
            path: tlv.Field(1, tlv.Object({
                endpointId: tlv.Field(2, tlv.UInt16),
                clusterId: tlv.Field(3, tlv.UInt32),
                id: tlv.Field(4, tlv.UInt32),
            }, TlvType.List)),
            value: tlv.Field(2, AnyT),
        })),
    }))),
    isFabricFiltered: tlv.OptionalField(4,  tlv.Boolean),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const SubscribeRequestT = tlv.Object({
    keepSubscriptions: tlv.Field(0,  tlv.Boolean),
    minIntervalFloorSeconds: tlv.Field(1, tlv.UInt16),
    maxIntervalCeilingSeconds: tlv.Field(2, tlv.UInt16),
    attributeRequests: tlv.OptionalField(3, tlv.Array(AttributePathT)),
    eventRequests: tlv.OptionalField(4, tlv.Array(tlv.Object({
        node: tlv.Field(0, NodeIdT),
        endpoint: tlv.Field(1, tlv.UInt16),
        cluster: tlv.Field(2, tlv.UInt32),
        event: tlv.Field(3, tlv.UInt32),
        isUrgent: tlv.Field(4,  tlv.Boolean),
    }, TlvType.List))),
    eventFilters: tlv.OptionalField(5, tlv.Array(tlv.Object({
        node: tlv.Field(0, NodeIdT),
        eventMin: tlv.Field(1, UInt64T),
    }, TlvType.List))),
    isFabricFiltered: tlv.Field(7,  tlv.Boolean),
    dataVersionFilters: tlv.OptionalField(8, tlv.Array(tlv.Object({
        path: tlv.Field(0, tlv.Object({
            node: tlv.Field(0, NodeIdT),
            endpoint: tlv.Field(1, tlv.UInt16),
            cluster: tlv.Field(2, tlv.UInt32),
        }, TlvType.List)),
        dataVersion: tlv.Field(1, tlv.UInt32),
    }))),
});

export const SubscribeResponseT = tlv.Object({
    subscriptionId: tlv.Field(0, tlv.UInt32),
    maxIntervalCeilingSeconds: tlv.Field(2, tlv.UInt16),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const InvokeRequestT = tlv.Object({
    suppressResponse: tlv.Field(0,  tlv.Boolean),
    timedRequest: tlv.Field(1,  tlv.Boolean),
    invokes: tlv.Field(2, tlv.Array(tlv.Object({
        path: tlv.Field(0, tlv.Object({
            endpointId: tlv.Field(0, tlv.UInt16),
            clusterId: tlv.Field(1, tlv.UInt32),
            id: tlv.Field(2, tlv.UInt32),
        }, TlvType.List)),
        args: tlv.Field(1, AnyT),
    }))),
});

export const InvokeResponseT = tlv.Object({
    suppressResponse: tlv.Field(0,  tlv.Boolean),
    responses: tlv.Field(1, tlv.Array(tlv.Object({
        response: tlv.OptionalField(0, tlv.Object({
            path: tlv.Field(0, tlv.Object({
                endpointId: tlv.Field(0, tlv.UInt16),
                clusterId: tlv.Field(1, tlv.UInt32),
                id: tlv.Field(2, tlv.UInt32),
            }, TlvType.List)),
            response: tlv.Field(1, AnyT),
        })),
        result: tlv.OptionalField(1, tlv.Object({
            path: tlv.Field(0, tlv.Object({
                endpointId: tlv.Field(0, tlv.UInt16),
                clusterId: tlv.Field(1, tlv.UInt32),
                id: tlv.Field(2, tlv.UInt32),
            }, TlvType.List)),
            result: tlv.Field(1, tlv.Object({
                code: tlv.Field(0, tlv.UInt16),
            })),
        })),
    }))),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});
