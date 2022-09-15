/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from "assert";
import { BasicClusterServer } from "../../src/interaction/cluster/BasicCluster";
import { TlvType } from "../../src/codec/TlvCodec";
import { TlvTag } from "../../src/codec/TlvTag";
import { InteractionProtocol } from "../../src/interaction/InteractionProtocol";
import { ReadRequest, DataReport } from "../../src/interaction/InteractionMessenger";
import { Device } from "../../src/interaction/model/Device";
import { Endpoint } from "../../src/interaction/model/Endpoint";
import { MessageExchange } from "../../src/matter/common/MessageExchange";
import { DEVICE } from "../../src/Devices";
import { MatterServer } from "../../src/matter/MatterServer";

const READ_REQUEST: ReadRequest = {
    interactionModelRevision: 1,
    isFabricFiltered: true,
    attributes: [
        { endpointId: 0, clusterId: 0x28, attributeId: 2},
        { endpointId: 0, clusterId: 0x28, attributeId: 4},
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
                attributeId: 2,
            },
            value: {
                tag: TlvTag.Anonymous,
                type: TlvType.UnsignedInt,
                value: 1,
            },
            version: 0,
        }},
        { value: {
            path: {
                endpointId: 0,
                clusterId: 0x28,
                attributeId: 4,
            },
            value: {
                tag: TlvTag.Anonymous,
                type: TlvType.UnsignedInt,
                value: 2,
            },
            version: 0,
        }},
    ]
};

describe("InteractionProtocol", () => {

    context("handleReadRequest", () => {
        it("replies with attribute values", () => {
            const interactionProtocol = new InteractionProtocol(new Device([
                new Endpoint(0, DEVICE.ROOT, [
                    BasicClusterServer.Builder({ vendorName: "vendor", vendorId: 1, productName: "product", productId: 2 }),
                ])
            ]));

            const result = interactionProtocol.handleReadRequest(({channel: {getName: () => "test"}}) as MessageExchange<MatterServer>, READ_REQUEST);

            assert.deepEqual(result, READ_RESPONSE);
        });
    });
});
