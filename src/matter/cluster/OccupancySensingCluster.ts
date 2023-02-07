/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, OptionalAttribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvInt16, TlvUInt16, TlvEnum, TlvField, TlvNullable, TlvObject, TlvSchema, TlvUInt8 } from "@project-chip/matter.js";

/**
 * Attributes and commands for Occupancy Detection.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7
 */


/** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.5.1 */
export const occupancyBitmap = TlvBitmap(TlvUInt8, {
    occupied: BitFlag(0),
})

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.5.2 */
export const enum OccupancySensorType {
    PIR = 0,
    Ultrasonic = 1,
    PIRAndUltrasonic = 2,
    PhysicalContact = 3,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.5.3 */
export const OccupancySensorTypeBitmap = TlvBitmap(TlvUInt8, {
    PIR: BitFlag(0),
    ultrasonic: BitFlag(1),
    physicalContact: BitFlag(2)
})

export const OccupancySensingCluster = Cluster({
    id: 0x0406,
    name: "OccupancySensing",
    revision: 3,

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.5 */
    attributes: {
       occupancy: Attribute( 0x0000, TlvUInt8 ),
       occupancySensorType: Attribute( 0x0001,  TlvEnum<OccupancySensorType>() ),
       occupancySensorTypeBitmap: Attribute( 0x0002, TlvUInt8 ),

       /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.6 */
       pirOccupiedToUnoccupiedDelay: OptionalAttribute( 0x0010, TlvUInt16, { default: 0 }),
       pirUnoccupiedToOccupiedDelay: OptionalAttribute( 0x0011, TlvUInt16, { default: 0 } ),
       pirUnoccupiedToOccupiedThreshold: OptionalAttribute( 0x0012, TlvUInt8, { default: 1 } ),

       /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.7 */
       ultrasonicOccupiedToUnoccupiedDelay: OptionalAttribute( 0x0020, TlvUInt16, { default: 0 }), 
       ultrasonicUnoccupiedToOccupiedDelay: OptionalAttribute( 0x0021, TlvUInt16, { default: 0 }), 
       ultrasonicUnoccupiedToOccupiedThreshold: OptionalAttribute( 0x0022, TlvUInt8, { default: 1 } ), 

       /** @see {@link MatterApplicationClusterSpecificationV1_0} § 2.7.8 */
       physicalContactOccupiedToUnoccupiedDelay: OptionalAttribute( 0x0030, TlvNullable(TlvUInt16), { default: 0 }), 
       physicalContactUnoccupiedToOccupiedDelay: OptionalAttribute( 0x0031, TlvNullable(TlvUInt16), { default: 0 }), 
       physicalContactUnoccupiedToOccupiedThreshold: OptionalAttribute( 0x0032, TlvUInt8, { default: 1 } ), 
    },
});
