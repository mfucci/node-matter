import assert from "assert";
import { BasicCluster } from "../../src/cluster/BasicCluster";
import { TlvType } from "../../src/codec/TlvCodec";
import { InteractionManager } from "../../src/interaction/InteractionManager";
import { ReadRequest, ReadResponse } from "../../src/interaction/InteractionMessenger";
import { Device } from "../../src/model/Device";
import { Endpoint } from "../../src/model/Endpoint";
import { Tag } from "../../src/models/Tag";

import crypto from "crypto";

const READ_REQUEST: ReadRequest = {
    interactionModelRevision: 1,
    isFabricFiltered: true,
    attributes: [
        { endpointId: 0, clusterId: 0x28, attributeId: 2},
        { endpointId: 0, clusterId: 0x28, attributeId: 4},
    ],
};

const READ_RESPONSE: ReadResponse = {
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
                tag: Tag.Anonymous,
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
                tag: Tag.Anonymous,
                type: TlvType.UnsignedInt,
                value: 2,
            },
            version: 0,
        }},
    ]
};

describe("InteractionManager", () => {

    context("handleReadRequest", () => {
        it("replies with attribute values", () => {
            const interactionManager = new InteractionManager(new Device([
                new Endpoint(0, "root", [
                    new BasicCluster({vendorName: "vendor", vendorId: 1, productName: "product", productId: 2}),
                ])
            ]));

            const result = interactionManager.handleReadRequest(READ_REQUEST);

            assert.deepEqual(result, READ_RESPONSE);
        });
    });
});
