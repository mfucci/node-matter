/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { ClusterServer, InteractionServer } from "../../../src/matter/interaction/InteractionServer";
import { ReadRequest, DataReport } from "../../../src/matter/interaction/InteractionMessenger";
import { MessageExchange } from "../../../src/matter/common/MessageExchange";
import { DEVICE } from "../../../src/matter/common/DeviceTypes";
import { MatterDevice } from "../../../src/matter/MatterDevice";
import { BasicInformationCluster } from "../../../src/matter/cluster/BasicInformationCluster";
import { VendorId } from "../../../src/matter/common/VendorId";
import { TlvUInt8 } from "@project-chip/matter.js";
import { Time } from "../../../src/time/Time";
import { TimeFake } from "../../../src/time/TimeFake";

Time.get = () => new TimeFake(1262679233478);

const READ_REQUEST: ReadRequest = {
    interactionModelRevision: 1,
    isFabricFiltered: true,
    attributes: [
        { endpointId: 0, clusterId: 0x28, id: 2},
        { endpointId: 0, clusterId: 0x28, id: 4},
    ],
};

const READ_RESPONSE: DataReport = {
    interactionModelRevision: 1,
    isFabricFiltered: true,
    values: [
        { value: {
            path: {
                endpointId: 0,
                clusterId: 0x28,
                id: 2,
            },
            value: TlvUInt8.encodeTlv(1),
            version: 0,
        }},
        { value: {
            path: {
                endpointId: 0,
                clusterId: 0x28,
                id: 4,
            },
            value: TlvUInt8.encodeTlv(2),
            version: 0,
        }},
    ]
};

describe("InteractionProtocol", () => {

    context("handleReadRequest", () => {
        it("replies with attribute values", () => {
            const interactionProtocol = new InteractionServer()
                .addEndpoint(0, DEVICE.ROOT, [
                    new ClusterServer(BasicInformationCluster, {}, {
                        dataModelRevision: 1,
                        vendorName: "vendor",
                        vendorId: new VendorId(1),
                        productName: "product",
                        productId: 2,
                        nodeLabel: "",
                        hardwareVersion: 0,
                        hardwareVersionString: "",
                        location: "US",
                        localConfigDisabled: false,
                        softwareVersion: 1,
                        softwareVersionString: "v1",
                        capabilityMinima: {
                            caseSessionsPerFabric: 100,
                            subscriptionsPerFabric: 100,
                        },
                    }, {}),
                ]);

            const result = interactionProtocol.handleReadRequest(({channel: {getName: () => "test"}}) as MessageExchange<MatterDevice>, READ_REQUEST);

            assert.deepEqual(result, READ_RESPONSE);
        });
    });
});
