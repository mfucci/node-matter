/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, ObjectT, OptionalField } from "../../codec/TlvObjectCodec";
import { Cluster, WritableAttribute } from "./Cluster";
import { ClusterIdT } from "../common/ClusterId";
import { EndpointNumberT } from "../common/EndpointNumber";
import { NodeIdT } from "../common/NodeId";
import { GroupIdT } from "../common/GroupId";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * Provides information about endpoint conformance to a release of a device type definition.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.5.5.1
 */
const TargetT = ObjectT({
    /**  Contains the remote target node ID. If the Endpoint field is present, this field SHALL be present. */
    node: OptionalField(1, NodeIdT),
    /** Contains the target group ID that represents remote endpoints. If the Endpoint field is present, this field SHALL NOT be present. */
    group: OptionalField(2, GroupIdT),
    /** Contains the remote endpoint that the local endpoint is bound to. If the Group field is present, this field SHALL NOT be present. */
    endpoint: OptionalField(3, EndpointNumberT),
    /**
     * Contains the cluster ID (client & server) on the local and target endpoint(s). If this field is present, the
     * client cluster SHALL also exist on this endpoint (with this Binding cluster). If this field is present, the
     * target SHALL be this cluster on the target endpoint(s).
     */
    cluster: OptionalField(4, ClusterIdT),
});

/**
 * A binding represents a persistent relationship between an endpoint and one or more other local or
 * remote endpoints. A binding does not require that the relationship exists. It is up to the node
 * application to set up the relationship.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.6
 */
export const BindingCluster = Cluster({
    id: 0x1e,
    name: "Binding",
    revision: 1,

    /** @see {@link MatterCoreSpecificationV1_0} § 9.6.5 */
    attributes: {
        /** List of device types and corresponding revisions declaring endpoint conformance. */
        binding: WritableAttribute(0, ArrayT(TargetT), { default: [] }), /* non-volatile */
    },
});
