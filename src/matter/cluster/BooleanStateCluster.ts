/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, OptionalEvent, EventPriority, OptionalAttribute, Cluster, Command, TlvNoArguments, TlvNoResponse } from "./Cluster";
import { TlvField, TlvBoolean, MatterApplicationClusterSpecificationV1_0 } from "@project-chip/matter.js";

/**
 * Attributes and commands for Illuminance Measurement.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.7
 */
export const BooleanStateCluster = Cluster({
    id: 0x0045,
    name: "BooleanState",
    revision: 1,
    features: { }, // no features

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.7.5 */
    attributes: {
       /** The semantics of this boolean state are defined by the device type using this cluster.
        * For example, in a Contact Sensor device type, FALSE=open or no contact, TRUE=closed or contact */
       stateValue: Attribute(0x00, TlvBoolean),
    },
        /** @see {@link MatterApplicationClusterSpecificationV1_0 1.7.5} */
    events: {
        /** generated when the StateValue attribute changes */
        stateChange: OptionalEvent(0, EventPriority.Info, { stateValue: TlvField(0, TlvBoolean)  }),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.7.6 */
    commands: { },
});
