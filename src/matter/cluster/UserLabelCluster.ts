/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, StringT } from "../../codec/TlvObjectCodec";
import { AccessLevel, Cluster, WritableAttribute } from "./Cluster";

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
 * This cluster provides a feature to tag an endpoint with zero or more labels.
 *
 * TODO: Derived from LabelCluster!
 *
 * clusterRevision: 1
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.9
 */
export const UserLabelCluster = Cluster({
    /** Is a base cluster, so no id */
    id: 0x41,
    name: "User Label",

    /** @see {@link MatterCoreSpecificationV1_0} § 9.9.4 */
    attributes: {
        /** An implementation SHALL support at least 4 list entries per node for all User Label cluster instances on the node. */
        labelList: WritableAttribute(0, ArrayT(LabelT), { default: [], writeAcl: AccessLevel.Manage }), /* non-volatile */
    },
});
