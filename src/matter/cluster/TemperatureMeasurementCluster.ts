/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8 } from "@project-chip/matter.js";

/**
 * Attributes and commands for Temperature Measurement.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.3
 */
export const TemperatureMeasurementCluster = Cluster({
    id: 0x0402,
    name: "TemperatureMeasurement",
    revision: 4,
    features: { }, // no features

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.3.4 */
    attributes: {
       measuredValue: Attribute(0, TlvInt16.bound({ min: -27315, max: 32767 }), { default: 1 }),
       minMeasuredValue: Attribute(1, TlvInt16.bound({ min: -27315 , max: -27315 }), { default: 27315 }),
       maxMeasuredValue: Attribute(2, TlvInt16.bound({ min: 32767, max: 32767 }), { default: 32767 }),
       tolerance: Attribute(3, TlvUInt16.bound({ min: 0, max: 2048 }), { default: 1 }),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.3.5 */
    commands: { },
});
