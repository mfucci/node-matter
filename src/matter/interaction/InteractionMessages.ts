/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvNodeId } from "../common/NodeId";
import {
    MatterCoreSpecificationV1_0,
    TlvAny,
    TlvArray,
    TlvBoolean,
    TlvEnum,
    TlvField,
    TlvList,
    TlvNullable,
    TlvObject,
    TlvOptionalField,
    TlvUInt16,
    TlvUInt32,
    TlvUInt64,
    TlvUInt8
} from "@project-chip/matter.js";

/**
 * @see {@link MatterCoreSpecificationV1_0}, section 8.10
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
export const TlvStatusResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

export const TlvAttributePath = TlvList({
    enableTagCompression: TlvOptionalField(0, TlvBoolean),
    nodeId: TlvOptionalField(1, TlvNodeId),
    endpointId: TlvOptionalField(2, TlvUInt16),
    clusterId: TlvOptionalField(3, TlvUInt32),
    attributeId: TlvOptionalField(4, TlvUInt32),
    listIndex: TlvOptionalField(5,  TlvNullable(TlvUInt16)),
});

export const TlvReadRequest = TlvObject({
    attributes: TlvField(0, TlvArray(TlvAttributePath)),
    isFabricFiltered: TlvField(3,  TlvBoolean),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

export const TlvAttributeReportPath = TlvList({
    enableTagCompression: TlvOptionalField(0, TlvBoolean),
    nodeId: TlvOptionalField(1, TlvNodeId),
    endpointId: TlvField(2, TlvUInt16), // TODO: could be optional, handling then defined by enableTagCompression
    clusterId: TlvField(3, TlvUInt32),
    attributeId: TlvField(4, TlvUInt32),
    listIndex: TlvOptionalField(5,  TlvNullable(TlvUInt16)),
});

export const TlvAttributeReportValue = TlvObject({
    version: TlvField(0, TlvUInt32),
    path: TlvField(1, TlvAttributeReportPath),
    value: TlvField(2, TlvAny),
});

export const TlvAttributeReport = TlvObject({
    value: TlvField(1, TlvAttributeReportValue),
});

export const TlvDataReport = TlvObject({
    subscriptionId: TlvOptionalField(0, TlvUInt32),
    values: TlvField(1, TlvArray(TlvAttributeReport)),
    moreChunkedMessages: TlvOptionalField(3, TlvBoolean),
    suppressResponse: TlvOptionalField(4, TlvBoolean),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

export const TlvSubscribeRequest = TlvObject({
    keepSubscriptions: TlvField(0, TlvBoolean),
    minIntervalFloorSeconds: TlvField(1, TlvUInt16),
    maxIntervalCeilingSeconds: TlvField(2, TlvUInt16),
    attributeRequests: TlvOptionalField(3, TlvArray(TlvAttributePath)),
    eventRequests: TlvOptionalField(4, TlvArray(TlvList({
        node: TlvOptionalField(0, TlvNodeId),
        endpoint: TlvOptionalField(1, TlvUInt16),
        cluster: TlvOptionalField(2, TlvUInt32),
        event: TlvOptionalField(3, TlvUInt32),
        isUrgent: TlvOptionalField(4,  TlvBoolean),
    }))),
    eventFilters: TlvOptionalField(5, TlvArray(TlvList({
        node: TlvField(0, TlvNodeId),
        eventMin: TlvField(1, TlvUInt64),
    }))),
    isFabricFiltered: TlvField(7,  TlvBoolean),
    dataVersionFilters: TlvOptionalField(8, TlvArray(TlvObject({
        path: TlvField(0, TlvList({
            node: TlvField(0, TlvNodeId),
            endpoint: TlvField(1, TlvUInt16),
            cluster: TlvField(2, TlvUInt32),
        })),
        dataVersion: TlvField(1, TlvUInt32),
    }))),
});

export const TlvSubscribeResponse = TlvObject({
    subscriptionId: TlvField(0, TlvUInt32),
    maxIntervalCeilingSeconds: TlvField(2, TlvUInt16),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

export const TlvCommandPath = TlvList({
    endpointId: TlvField(0, TlvUInt16),
    clusterId: TlvField(1, TlvUInt32),
    commandId: TlvField(2, TlvUInt32),
});

export const TlvInvokeRequest = TlvObject({
    suppressResponse: TlvField(0,  TlvBoolean),
    timedRequest: TlvField(1,  TlvBoolean),
    invokes: TlvField(2, TlvArray(TlvObject({
        path: TlvField(0, TlvCommandPath),
        args: TlvField(1, TlvAny),
    }))),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

export const TlvInvokeResponse = TlvObject({
    suppressResponse: TlvField(0,  TlvBoolean),
    responses: TlvField(1, TlvArray(TlvObject({
        response: TlvOptionalField(0, TlvObject({
            path: TlvField(0, TlvCommandPath),
            response: TlvField(1, TlvAny),
        })),
        result: TlvOptionalField(1, TlvObject({
            path: TlvField(0, TlvCommandPath),
            result: TlvField(1, TlvObject({
                code: TlvField(0, TlvUInt16),
            })),
        })),
    }))),
    interactionModelRevision: TlvField(0xFF, TlvUInt8),
});

/**
 * @see {@link MatterCoreSpecificationV1_0} § 10.6.8
 */
export const TlvTimedRequest = TlvObject({
    timeout: TlvField(0, TlvUInt16),
});
