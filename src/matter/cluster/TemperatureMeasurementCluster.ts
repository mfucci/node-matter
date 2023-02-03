/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, OptionalAttribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8 } from "@project-chip/matter.js";

/**
 * Attributes for Temperature Measurement.
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
       /** MeasuredValue = 100 x temperature [°C] **/
       measuredValue: Attribute(0, TlvNullable(TlvInt16)),

       /** Indicates the minimum value of MeasuredValue that can be measured. */
       minMeasuredValue: Attribute(1, TlvNullable(TlvInt16.bound({ min: -27315 }))),

       /** Indicates the maximum value of MeasuredValue that can be measured. */
       maxMeasuredValue: Attribute(2, TlvNullable(TlvInt16.bound({ max: 32767 }))),

       tolerance: OptionalAttribute(3, TlvUInt16.bound({ min: 0, max: 2048 }), { default: 0 }),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.3.5 */
    commands: { },
});
