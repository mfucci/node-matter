/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cluster, WritableAttribute } from "./Cluster";
import { TlvClusterId } from "../common/ClusterId";
import { TlvEndpointNumber } from "../common/EndpointNumber";
import { TlvNodeId } from "../common/NodeId";
import { TlvGroupId } from "../common/GroupId";
import { tlv, spec } from "@project-chip/matter.js";

/**
 * Provides information about endpoint conformance to a release of a device type definition.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.5.5.1
 */
const TlvTarget = tlv.Object({
    /**  Contains the remote target node ID. If the Endpoint field is present, this field SHALL be present. */
    node: tlv.OptionalField(1, TlvNodeId),

    /** Contains the target group ID that represents remote endpoints. If the Endpoint field is present, this field SHALL NOT be present. */
    group: tlv.OptionalField(2, TlvGroupId),

    /** Contains the remote endpoint that the local endpoint is bound to. If the Group field is present, this field SHALL NOT be present. */
    endpoint: tlv.OptionalField(3, TlvEndpointNumber),

    /**
     * Contains the cluster ID (client & server) on the local and target endpoint(s). If this field is present, the
     * client cluster SHALL also exist on this endpoint (with this Binding cluster). If this field is present, the
     * target SHALL be this cluster on the target endpoint(s).
     */
    cluster: tlv.OptionalField(4, TlvClusterId),
});

/**
 * A binding represents a persistent relationship between an endpoint and one or more other local or
 * remote endpoints. A binding does not require that the relationship exists. It is up to the node
 * application to set up the relationship.
 *
 * @see {@link spec.MatterCoreSpecificationV1_0} § 9.6
 */
export const BindingCluster = Cluster({
    id: 0x1e,
    name: "Binding",
    revision: 1,

    /** @see {@link spec.MatterCoreSpecificationV1_0} § 9.6.5 */
    attributes: {
        /** List of device types and corresponding revisions declaring endpoint conformance. */
        binding: WritableAttribute(0, tlv.Array(TlvTarget), { default: [] }), /* non-volatile */
    },
});
