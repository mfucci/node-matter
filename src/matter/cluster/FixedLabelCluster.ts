/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, StringT } from "../../codec/TlvObjectCodec";
import { Cluster, Attribute } from "./Cluster";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 *
 * This is a string tuple with strings that are user defined.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.7.5.1
 */
const LabelT = ObjectT({
    /** Contains a string as label without a further defined semantic n this base cluster. */
    label: Field(0, StringT( { length: 16 } )), /* default: "" */
    /** Contains a string as value without a further defined semantic n this base cluster. */
    value: Field(1, StringT( { length: 16 } )), /* default: "" */
});

/**
 * This cluster provides a feature for the device to tag an endpoint with zero or more read only labels.
 *
 * TODO: Derived from LabelCluster!
 *
 * clusterRevision: 1
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.8
 */
export const FixedLabelCluster = Cluster({
    /** Is a base cluster, so no id */
    id: 0x40,
    name: "Fixed Label",

    /** @see {@link MatterCoreSpecificationV1_0} § 9.8.4 */
    attributes: {
        /** List of fixed labels. */
        labelList: Attribute(0, ArrayT(LabelT), { default: [] }), /* non-volatile */
    },
});
