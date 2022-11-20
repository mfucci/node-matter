/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessLevel, Attribute, Cluster, Command, TlvNoArguments, WritableAttribute } from "./Cluster";
import { tlv, spec } from "@project-chip/matter.js";

/**
 * This enumeration is used by the RegulatoryConfig and LocationCapability attributes to indicate possible radio usage.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.5.3
 */
export const enum RegulatoryLocationType {
    /** Indoor only */
    Indoor = 0,

    /** Outdoor only */
    Outdoor = 1,

    /** Indoor/Outdoor */
    IndoorOutdoor = 2,
}

/**
 * This enumeration is used by several response commands in this cluster to indicate particular errors.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.5.1
 */
export const enum CommissioningError {
    /** No error. */
    Ok = 0,

    /** Attempting to set regulatory configuration to a region or indoor/outdoor mode for which the server does not have proper configuration. */
    ValueOutsideRange = 1,

    /** Executed CommissioningComplete outside CASE session. */
    InvalidAuthentication = 2,

    /** Executed CommissioningComplete when there was no active Fail-Safe context. */
    NoFailSafe = 3,

    /** Attempting to arm fail-safe or execute CommissioningComplete from a fabric different than the one associated with the current fail-safe context. */
    BusyWithOtherAdmin = 4,
}

/**
 * This structure provides some constant values that MAY be of use to all commissioners.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.5.2
 */
const TlvBasicCommissioningInfo = tlv.Object({
    /** Contains a conservative initial duration (in seconds) to set in the FailSafe for the commissioning flow to complete successfully. */
    failSafeExpiryLengthSeconds: tlv.Field(0, tlv.UInt16),

    /** Contain a conservative value in seconds denoting the maximum total duration for which a fail-safe timer can be re-armed. */
    maxCumulativeFailsafeSeconds: tlv.Field(1, tlv.UInt16),
});

/**
 * Used by the following commands as response payload:
 * ArmFailSafeResponse, @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7.3
 * CommissioningCompleteResponse, @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7.7
 * CommissioningCompleteResponse, @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7.7
 */
const TlvCommissioningSuccessFailureResponse = tlv.Object({
    /** Contain the result of the operation. */
    errorCode: tlv.Field(0, tlv.Enum<CommissioningError>()),

    /** Should help developers in troubleshooting errors. The value MAY go into logs or crash reports, not User UIs. */
    debugText: tlv.Field(1, tlv.String.bound({ maxLength: 128 })),
});
export type CommissioningSuccessFailureResponse = tlv.TypeFromSchema<typeof TlvCommissioningSuccessFailureResponse>;

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7.3. */
const TlvArmFailSafeRequest = tlv.Object({
    /** Contains timeframe for fail-safe timer actions. */
    expiryLengthSeconds: tlv.Field(0, tlv.UInt16), /* default: 900 */

    /** Value to atomically set the Breadcrumb attribute on success of this command. */
    breadcrumbStep: tlv.Field(1, tlv.UInt64),
});

/** @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7.4 */
const TlvSetRegulatoryConfigRequest = tlv.Object({
    /** Contains the new regulatory location to be set. */
    newRegulatoryConfig: tlv.Field(0, tlv.Enum<RegulatoryLocationType>()),

    /** Contains a ISO 3166-1 alpha-2 country code*/
    countryCode: tlv.Field(1, tlv.String.bound({ length: 2 })),

    /** Value to atomically set the Breadcrumb attribute on success of this command. */
    breadcrumbStep: tlv.Field(2, tlv.UInt64),
});

/**
 * This cluster is used to manage global aspects of the Commissioning flow.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 11.9
 */
export const GeneralCommissioningCluster = Cluster({
    id: 0x30,
    name: "General Commissioning",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.6 */
    attributes: {
        /** Allows for the storage of a client-provided small payload which Administrators and Commissioners MAY write
         * and then subsequently read, to keep track of their own progress.
         */
        breadcrumb: WritableAttribute(0, tlv.UInt64, { default: BigInt(0), writeAcl: AccessLevel.Administer }),

        /** Describe critical parameters needed at the beginning of commissioning flow. */
        commissioningInfo: Attribute(1, TlvBasicCommissioningInfo),

        /** Indicates the regulatory configuration for the product. */
        regulatoryConfig: Attribute(2, tlv.Enum<RegulatoryLocationType>()), /* default: value of locationCapability */

        /** Indicates if this Node needs to be told an exact RegulatoryLocation. */
        locationCapability: Attribute(3, tlv.Enum<RegulatoryLocationType>(), { default: RegulatoryLocationType.IndoorOutdoor }),

        /** Indicates whether this device supports "concurrent connection flow" commissioning mode */
        supportsConcurrentConnections: Attribute(4, tlv.Boolean, { default: true }),
    },

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 11.9.7 */
    commands: {
        /** Arms the persistent fail-safe timer with an expiry time of now + ExpiryLengthSeconds using device clock. */
        armFailSafe: Command(0, TlvArmFailSafeRequest, 1, TlvCommissioningSuccessFailureResponse),

        /** Sets or Updates the regulatory configuration to be used during commissioning. */
        setRegulatoryConfig: Command(2, TlvSetRegulatoryConfigRequest, 3, TlvCommissioningSuccessFailureResponse),

        /**
         * Informs that all steps of Commissioning/Reconfiguration needed during the fail-safe period have been
         * completed.
         */
        commissioningComplete: Command(4, TlvNoArguments, 5, TlvCommissioningSuccessFailureResponse),
    },
});
