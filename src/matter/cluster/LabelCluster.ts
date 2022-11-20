/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AccessLevel, Attribute, Cluster, WritableAttribute } from "./Cluster";
import { tlv, spec } from "@project-chip/matter.js";

/**
 * This is a string tuple with strings that are user defined.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.7.5.1
 */
const TlvLabel = tlv.Object({
    /** Contains a string as label without a further defined semantic n this base cluster. */
    label: tlv.Field(0, tlv.String.bound( { length: 16 } )), /* default: "" */

    /** Contains a string as value without a further defined semantic n this base cluster. */
    value: tlv.Field(1, tlv.String.bound( { length: 16 } )), /* default: "" */
});

/**
 * This cluster provides a feature to tag an endpoint with zero or more labels.
 * Derived from LabelCluster ({@link spec.MatterCoreSpecificationV1_0} § 9.7)
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.9
 */
export const UserLabelCluster = Cluster({
    id: 0x41,
    name: "User Label",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 9.9.4 */
    attributes: {
        /** An implementation SHALL support at least 4 list entries per node for all User Label cluster instances on the node. */
        labelList: WritableAttribute(0, tlv.Array(TlvLabel), { default: [], writeAcl: AccessLevel.Manage }), /* non-volatile */
    },
});

/**
 * This cluster provides a feature for the device to tag an endpoint with zero or more read only labels.
 * Derived from LabelCluster ({@link spec.MatterCoreSpecificationV1_0} § 9.7)
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.8
 */
export const FixedLabelCluster = Cluster({
    id: 0x40,
    name: "Fixed Label",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 9.8.4 */
    attributes: {
        /** List of fixed labels. */
        labelList: Attribute(0, tlv.Array(TlvLabel), { default: [] }), /* non-volatile */
    },
});
