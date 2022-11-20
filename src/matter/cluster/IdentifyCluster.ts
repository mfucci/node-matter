/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, WritableAttribute, Cluster, Command, OptionalCommand, TlvNoResponse } from "./Cluster";
import { tlv, spec, schema } from "@project-chip/matter.js";

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.5.2 */
export const enum IdentifyType {
    None = 0,
    VisibleLight = 1,
    VisibleLED = 2,
    AudibleBeep = 3,
    Display = 4,
    Actuator = 5,
}

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6.3.1 */
export const enum EffectIdentifier {
    Blink = 0,
    Breathe = 1,
    Okay = 2,
    ChannelChange = 0x0b,
    FinishEffect = 0xfe,
    StopEffect = 0xff,
}

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6.3.2 */
export const enum EffectVariant {
    Default = 0,
}

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6.1 */
const TlvIdentifyRequest = tlv.Object({
    identifyTime: tlv.Field(0, tlv.UInt16),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6.3 */
const TlvTriggerEffectRequest = tlv.Object({
    effectIdentifier: tlv.Field(0, tlv.Enum<EffectIdentifier>()),
    effectVariant: tlv.Field(1, tlv.Enum<EffectVariant>()),
});

/** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6.4 */
const TlvIdentifyQueryResponse = tlv.Object({
    timeout: tlv.Field(0, tlv.UInt16),
});

/**
 * Attributes and commands for putting a device into Identification mode (e.g. flashing a light).
 *
 * @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2
 */
export const IdentifyCluster = Cluster({
    id: 0x03,
    name: "Identify",
    revision: 4,
    features: {
        /** Replies to multicast / groupcast queries if the identification state is active. */
        query: schema.BitFlag(0),
    },

    /** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.5 */
    attributes: {
        /** Specifies the remaining length of time, in seconds, that the endpoint will continue to identify itself. */
        identifyTime: WritableAttribute(0, tlv.UInt16, { default: 0 }), /* unit: seconds */

        /** Specifies how the identification state is presented to the user. */
        identifyType: Attribute(1, tlv.Enum<IdentifyType>(), { default: 0 }),
    },

    /** @see {@link spec.MatterApplicationClusterSpecificationV1_0} § 1.2.6 */
    commands: {
        /** Starts or stops the receiving device identifying itself. */
        identify: Command(0, TlvIdentifyRequest, 0, TlvNoResponse),

        /**
         * Allows the sending device to request the target or targets to respond if they are currently identifying themselves.
         *
         * TODO: Add when adding support for the Query Feature
         */
        //identifyQuery: Command(1, NoArgumentsT, 0, TlvIdentifyQueryResponse),

        /** Allows the support of feedback to the user, such as a certain light effect when identifying. */
        triggerEffect: OptionalCommand(0x40, TlvTriggerEffectRequest, 0, TlvNoResponse),
    },
});
