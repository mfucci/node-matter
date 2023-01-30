/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatusCode } from "../matter/interaction/InteractionMessages";

/** Error base class for all errors thrown by this library. */
export class MatterError extends Error {}

/** Specific Error for when a fabric is not found. */
export class FabricNotFoundError extends MatterError {}


/** Error base Class for all errors related to the status response messages. */
export class StatusResponseError extends MatterError {
    private static errorMap = new Map<StatusCode, new(...args: any[]) => StatusResponseError>();

    static registerErrorClass(statusCode: StatusCode, errorClass: new(...args: any[]) => StatusResponseError) {
        this.errorMap.set(statusCode, errorClass);
    }

    static getErrorClass(statusCode: StatusCode) {
        return this.errorMap.get(statusCode) || StatusResponseError;
    }
}

// Explicit Error Classes for all Status Codes
export class FailureStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.Failure, FailureStatusResponseError);

export class InvalidSubscriptionStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.InvalidSubscription, InvalidSubscriptionStatusResponseError);

export class UnsupportedAccessStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedAccess, UnsupportedAccessStatusResponseError);

export class UnsupportedEndpointStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedEndpoint, UnsupportedEndpointStatusResponseError);

export class InvalidActionStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.InvalidAction, InvalidActionStatusResponseError);

export class UnsupportedCommandStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedCommand, UnsupportedCommandStatusResponseError);

export class InvalidCommandStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.InvalidCommand, InvalidCommandStatusResponseError);

export class UnsupportedAttributeStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedAttribute, UnsupportedAttributeStatusResponseError);
export class ConstraintErrorStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.ConstraintError, ConstraintErrorStatusResponseError);

export class UnsupportedWriteStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedWrite, UnsupportedWriteStatusResponseError);

export class ResourceExhaustedStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.ResourceExhausted, ResourceExhaustedStatusResponseError);

export class NotFoundStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.NotFound, NotFoundStatusResponseError);

export class UnreportableAttributeStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnreportableAttribute, UnreportableAttributeStatusResponseError);

export class InvalidDataTypeStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.InvalidDataType, InvalidDataTypeStatusResponseError);

export class UnsupportedReadStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedRead, UnsupportedReadStatusResponseError);

export class DataVersionMismatchStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.DataVersionMismatch, DataVersionMismatchStatusResponseError);

export class TimeoutStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.Timeout, TimeoutStatusResponseError);

export class UnsupportedModeStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedMode, UnsupportedModeStatusResponseError);

export class BusyStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.Busy, BusyStatusResponseError);

export class UnsupportedClusterStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedCluster, UnsupportedClusterStatusResponseError);

export class NoUpstreamSubscriptionStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.NoUpstreamSubscription, NoUpstreamSubscriptionStatusResponseError);

export class NeedsTimedInteractionStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.NeedsTimedInteraction, NeedsTimedInteractionStatusResponseError);

export class UnsupportedEventStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.UnsupportedEvent, UnsupportedEventStatusResponseError);

export class PathsExhaustedStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.PathsExhausted, PathsExhaustedStatusResponseError);

export class TimedRequestMismatchStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.TimedRequestMismatch, TimedRequestMismatchStatusResponseError);

export class FailsafeRequiredStatusResponseError extends StatusResponseError {}
StatusResponseError.registerErrorClass(StatusCode.FailsafeRequired, FailsafeRequiredStatusResponseError);


export function isMatterError(e: unknown): e is MatterError {
    return e instanceof MatterError;
}

type MatterErrorHandler<T> = (error: MatterError) => T | undefined;

export function tryCatch<T>(codeBlock: () => T, errorType: typeof MatterError, fallbackValue: MatterErrorHandler<T> | T): T {
    try {
        return codeBlock();
    }
    catch (error) {
        if (isMatterError(error) && error instanceof errorType) {
            if (typeof fallbackValue === "function") {
                const computedFallbackValue = (fallbackValue as MatterErrorHandler<T>)(error);
                if (computedFallbackValue !== undefined) return computedFallbackValue;
            } else {
                return fallbackValue;
            }
        }
        throw error;
    }
}

