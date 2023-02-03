/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, OptionalAttribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8 } from "@project-chip/matter.js";

/**
 * Attributes and commands for Flow Measurement.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.5
 */
export const FlowMeasurementCluster = Cluster({
    id: 0x0404,
    name: "FlowMeasurement",
    revision: 3,
    features: { }, // no features

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.5.5 */
    attributes: {
       /** MeasuredValue represents the flow in m3 /h as follows: MeasuredValue = 10 x Flow */
       measuredValue: Attribute(0, TlvNullable(TlvUInt16), { default: null }),
       
       /** Indicates the minimum value of MeasuredValue that can be measured. */
       minMeasuredValue: Attribute(1, TlvNullable(TlvUInt16.bound({ min: 1 }))),
       
       /** Indicates the maximum value of MeasuredValue that can be measured. */
       maxMeasuredValue: Attribute(2, TlvNullable(TlvUInt16.bound({ max: 65534 }))),

       tolerance: OptionalAttribute(3, TlvUInt16.bound({ min: 0, max: 2048 }), {default: 0 }),
       
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.5.6 */
    commands: { },
});
