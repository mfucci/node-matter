/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */


import {Attribute, OptionalAttribute, Cluster, Command, TlvNoArguments, TlvNoResponse} from "./Cluster";
import {BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8} from "@project-chip/matter.js";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.6.4 */
const  attributes = {
       /** MeasuredValue represents the water content in % as follows: MeasuredValue = 100 x water content */
       measuredValue: Attribute(0, TlvNullable(TlvUInt16.bound({min: 0, max: 10000}))),

       /** Indicates the minimum value of MeasuredValue that can be measured. */
       minMeasuredValue: Attribute(1, TlvNullable(TlvUInt16.bound({min: 0}))),

       /** Indicates the maximum value of MeasuredValue that can be measured. */
       maxMeasuredValue: Attribute(2, TlvNullable(TlvUInt16.bound({max: 10000}))),

       tolerance: OptionalAttribute(3, TlvUInt16.bound({min: 0, max: 2048})),
   };

/**
 * Attributes and commands for Percentage of water in the air.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.6.3
 */
export const RelativeHumidityCluster = Cluster({
    id: 0x0405,
    name: "RelativeHumidityMeasurement",
    revision: 3,
    attributes,
});

/**
 * Attributes and commands for Percentage of water in plants.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.6.3
 */
export const LeafWetnessMeasurementCluster = Cluster({
    id: 0x0407,
    name: "LeafWetnessMeasurement",
    revision: 3,
    attributes,
});

/**
 * Attributes and commands for Percentage of water in the soil.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.6.3
 */
export const SoilMoistureMeasurementCluster = Cluster({
    id: 0x0408, 
    name: "SoilMoistureMeasurement",
    revision: 3,
    attributes,
});

