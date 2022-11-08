/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    Field,
    ObjectT,
    EnumT,
    UInt16T,
    Bit
} from "../../codec/TlvObjectCodec";
import { Attribute, WritableAttribute, Cluster, Command, OptionalCommand, NoResponseT } from "./Cluster";
import { MatterApplicationClusterSpecificationV1_0 } from "../../Specifications";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.5.2 */
export const enum IdentifyType {
    None = 0,
    VisibleLight = 1,
    VisibleLED = 2,
    AudibleBeep = 3,
    Display = 4,
    Actuator = 5,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.3.1 */
export const enum EffectIdentifier {
    Blink = 0,
    Breathe = 1,
    Okay = 2,
    ChannelChange = 0x0b,
    FinishEffect = 0xfe,
    StopEffect = 0xff,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.3.2 */
export const enum EffectVariant {
    Default = 0,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.1 */
const IdentifyRequestT = ObjectT({
    identifyTime: Field(0, UInt16T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.3 */
const TriggerEffectRequestT = ObjectT({
    effectIdentifier: Field(0, EnumT<EffectIdentifier>()),
    effectVariant: Field(1, EnumT<EffectVariant>()),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.4 */
const IdentifyQueryResponseT = ObjectT({
    timeout: Field(0, UInt16T),
});

/**
 * Attributes and commands for putting a device into Identification mode (e.g. flashing a light).
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2
 */
export const IdentifyCluster = Cluster({
    id: 0x03,
    name: "Identify",
    revision: 4,
    features: {
        /** Replies to multicast / groupcast queries if the identification state is active. */
        query: Bit(0),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.5 */
    attributes: {
        /** Specifies the remaining length of time, in seconds, that the endpoint will continue to identify itself. */
        identifyTime: WritableAttribute(0, UInt16T, { default: 0 }), /* unit: seconds */
        /** Specifies how the identification state is presented to the user. */
        identifyType: Attribute(1, EnumT<IdentifyType>(), { default: 0 }),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6 */
    commands: {
        /**
         * Starts or stops the receiving device identifying itself.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.1
         */
        identify: Command(0, IdentifyRequestT, 0, NoResponseT),
        /**
         * Allows the sending device to request the target or targets to respond if they are currently identifying themselves.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.2
         *
         * TODO: Add when adding support for the Query Feature
         */
        //identifyQuery: Command(1, NoArgumentsT, 0, IdentifyQueryResponseT),
        /**
         * Allows the support of feedback to the user, such as a certain light effect when identifying.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.2.6.3
         */
        triggerEffect: OptionalCommand(0x40, TriggerEffectRequestT, 0, NoResponseT),
    },
});
