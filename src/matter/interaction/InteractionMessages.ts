/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvNodeId } from "../common/NodeId";
import { spec, tlv } from "@project-chip/matter.js";

/**
 * @see {@link spec.MatterCoreSpecificationV1_0}, section 8.10
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
export const TlvStatusResponse = tlv.Object({
    status: tlv.Field(0, tlv.Enum<StatusCode>()),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

const TlvAttributePath = tlv.List({
    endpointId: tlv.OptionalField(2, tlv.UInt16),
    clusterId: tlv.OptionalField(3, tlv.UInt32),
    id: tlv.OptionalField(4, tlv.UInt32),
});

export const TlvReadRequest = tlv.Object({
    attributes: tlv.Field(0, tlv.Array(TlvAttributePath)),
    isFabricFiltered: tlv.Field(3,  tlv.Boolean),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const TlvDataReport = tlv.Object({
    subscriptionId: tlv.OptionalField(0, tlv.UInt32),
    values: tlv.Field(1, tlv.Array(tlv.Object({
        value: tlv.Field(1, tlv.Object({
            version: tlv.Field(0, tlv.UInt32),
            path: tlv.Field(1, tlv.List({
                endpointId: tlv.Field(2, tlv.UInt16),
                clusterId: tlv.Field(3, tlv.UInt32),
                id: tlv.Field(4, tlv.UInt32),
            })),
            value: tlv.Field(2, tlv.Any),
        })),
    }))),
    isFabricFiltered: tlv.OptionalField(4,  tlv.Boolean),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const TlvSubscribeRequest = tlv.Object({
    keepSubscriptions: tlv.Field(0,  tlv.Boolean),
    minIntervalFloorSeconds: tlv.Field(1, tlv.UInt16),
    maxIntervalCeilingSeconds: tlv.Field(2, tlv.UInt16),
    attributeRequests: tlv.OptionalField(3, tlv.Array(TlvAttributePath)),
    eventRequests: tlv.OptionalField(4, tlv.Array(tlv.List({
        node: tlv.Field(0, TlvNodeId),
        endpoint: tlv.Field(1, tlv.UInt16),
        cluster: tlv.Field(2, tlv.UInt32),
        event: tlv.Field(3, tlv.UInt32),
        isUrgent: tlv.Field(4,  tlv.Boolean),
    }))),
    eventFilters: tlv.OptionalField(5, tlv.Array(tlv.List({
        node: tlv.Field(0, TlvNodeId),
        eventMin: tlv.Field(1, tlv.UInt64),
    }))),
    isFabricFiltered: tlv.Field(7,  tlv.Boolean),
    dataVersionFilters: tlv.OptionalField(8, tlv.Array(tlv.Object({
        path: tlv.Field(0, tlv.List({
            node: tlv.Field(0, TlvNodeId),
            endpoint: tlv.Field(1, tlv.UInt16),
            cluster: tlv.Field(2, tlv.UInt32),
        })),
        dataVersion: tlv.Field(1, tlv.UInt32),
    }))),
});

export const TlvSubscribeResponse = tlv.Object({
    subscriptionId: tlv.Field(0, tlv.UInt32),
    maxIntervalCeilingSeconds: tlv.Field(2, tlv.UInt16),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});

export const TlvInvokeRequest = tlv.Object({
    suppressResponse: tlv.Field(0,  tlv.Boolean),
    timedRequest: tlv.Field(1,  tlv.Boolean),
    invokes: tlv.Field(2, tlv.Array(tlv.Object({
        path: tlv.Field(0, tlv.List({
            endpointId: tlv.Field(0, tlv.UInt16),
            clusterId: tlv.Field(1, tlv.UInt32),
            id: tlv.Field(2, tlv.UInt32),
        })),
        args: tlv.Field(1, tlv.Any),
    }))),
});

export const TlvInvokeResponse = tlv.Object({
    suppressResponse: tlv.Field(0,  tlv.Boolean),
    responses: tlv.Field(1, tlv.Array(tlv.Object({
        response: tlv.OptionalField(0, tlv.Object({
            path: tlv.Field(0, tlv.List({
                endpointId: tlv.Field(0, tlv.UInt16),
                clusterId: tlv.Field(1, tlv.UInt32),
                id: tlv.Field(2, tlv.UInt32),
            })),
            response: tlv.Field(1, tlv.Any),
        })),
        result: tlv.OptionalField(1, tlv.Object({
            path: tlv.Field(0, tlv.List({
                endpointId: tlv.Field(0, tlv.UInt16),
                clusterId: tlv.Field(1, tlv.UInt32),
                id: tlv.Field(2, tlv.UInt32),
            })),
            result: tlv.Field(1, tlv.Object({
                code: tlv.Field(0, tlv.UInt16),
            })),
        })),
    }))),
    interactionModelRevision: tlv.Field(0xFF, tlv.UInt8),
});
