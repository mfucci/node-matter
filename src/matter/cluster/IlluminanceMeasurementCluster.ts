/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8 } from "@project-chip/matter.js";

/**
 * Attributes and commands for Illuminance Measurement.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.2
 */
export const IlluminanceMeasurementCluster = Cluster({
    id: 0x0400,
    name: "IlluminanceMeasurement",
    revision: 3,
    features: { }, // no features

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.2.5 */
    attributes: {
       /** Represents the illuminance in Lux (symbol lx): MeasuredValue = 10,000 x log10(illuminance) + 1 */
       measuredValue: Attribute(0, TlvNullable(TlvUInt16)), { default: 0 }),
       
       /** Indicates the minimum value of MeasuredValue that can be measured. */
       minMeasuredValue: Attribute(1, TlvNullable(TlvUInt16.bound({ min: 1 }))),
       
       /** Indicates the maximum value of MeasuredValue that can be measured. */
       maxMeasuredValue: Attribute(2, TlvNullable(TlvUInt16.bound({ max: 65534 }))),
       tolerance: OptionalAttribute(3, TlvUInt16.bound({ min: 0, max: 2048 })),
       
       /** Specifies the electronic type of the light sensor. */
       lightSensorType: OptionalAttribute(4, TlvNullable(TlvUInt8)), // only values null, 0, 1 and 0x40 to 0xfe are allowed
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.2.6 */
    commands: { },
});
