/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ArrayT, Field, ObjectT, UInt16T, Bound } from "../../codec/TlvObjectCodec";
import { Attribute, Cluster } from "./Cluster";
import { DeviceTypeIdT } from "../common/DeviceTypeId";
import { ClusterIdT } from "../common/ClusterId";
import { EndpointNumberT } from "../common/EndpointNumber";
import { MatterCoreSpecificationV1_0 } from "../../Specifications";

/**
 * Provides information about endpoint conformance to a release of a device type definition.
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.5.5.1
 */
const DeviceTypeT = ObjectT({
    /** Indicates the device type definition */
    type: Field(0, DeviceTypeIdT),
    /** Indicates the implemented revision of the device type definition */
    revision: Field(1, Bound(UInt16T, {min: 1})),
});

/**
 * This cluster describes an endpoint instance on the node, independently of other endpoints, but also
 * allows composition of endpoints to conform to complex device type patterns.
 * This Cluster is also meant to replace the support from the Zigbee Device Object (ZDO) for describing a node,
 * its endpoints and clusters.
 *
 * clusterRevision: 1
 *
 * @see {@link MatterCoreSpecificationV1_0} § 9.5
 */
export const DescriptorCluster = Cluster({
    id: 0x1d,
    name: "Descriptor",

    /** @see {@link MatterCoreSpecificationV1_0} § 9.5.4 */
    attributes: {
        /** List of device types and corresponding revisions declaring endpoint conformance. */
        deviceTypeList: Attribute(0, ArrayT(DeviceTypeT, { minLength: 1 })),
        /** List containing each cluster ID for the server clusters present on the endpoint instance. */
        serverList: Attribute(1, ArrayT(ClusterIdT), { default: [] }),
        /** List containing each cluster ID for the client clusters present on the endpoint instance. */
        clientList: Attribute(3, ArrayT(ClusterIdT), { default: [] }),
        /**
         * This indicates composition of the device type instance. Device type instance composition SHALL
         * include the endpoints in this list.
         */
        partsList: Attribute(4, ArrayT(EndpointNumberT), { default: [] }),
    },
});
