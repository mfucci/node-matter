/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, StringT } from "../../codec/TlvObjectCodec";
import { Cluster, WritableAttribute } from "./Cluster";
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
 * This cluster provides a feature to tag an endpoint with zero or more labels. This is a base cluster that
 * requires a derived cluster to create an instance.
 *
 * TODO: Do we need it? Only if we really inherit from it.
 *
 * clusterRevision: 1
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.7
 */
export const LabelCluster = Cluster({
    /** Is a base cluster, so no id */
    id: 0x00,
    name: "Label",

    /** @see {@link MatterCoreSpecificationV1_0} § 9.7.5 */
    attributes: {
        /** List of labels. */
        labelList: WritableAttribute(0, ArrayT(LabelT), { default: [] }), /* non-volatile */
    },
});
