import {ClusterServer, InteractionServer, pathToId} from "../../../src/matter/interaction/InteractionServer";
import { DEVICE } from "../../../src/matter/common/DeviceTypes";
import { BasicInformationCluster } from "../../../src/matter/cluster/BasicInformationCluster";
import { VendorId } from "../../../src/matter/common/VendorId";
import assert from "assert";
import {AttributeServer} from "../../../src/matter/cluster/server/AttributeServer";
import {EndpointNumber} from "../../../src/matter/common/EndpointNumber";
import {DescriptorCluster} from "../../../src/matter/cluster/DescriptorCluster";
import {OnOffCluster} from "../../../src/matter/cluster/OnOffCluster";
import {OnOffClusterHandler} from "../../../src/matter/cluster/server/OnOffServer";

describe("Endpoint", () => {

    context("Endpoint structures", () => {
        it("only Root endpoint in InteractionServer", () => {
            const basicInformationCluster = new ClusterServer(BasicInformationCluster, {}, {
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
            }, {});

            const interactionProtocol = new InteractionServer()
                .addEndpoint(0x00, DEVICE.ROOT, [basicInformationCluster,])
            ;

            assert.equal(interactionProtocol.endpoints.size, 1);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.size, 2);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = interactionProtocol.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.get(), []);

            assert.equal(interactionProtocol.attributePaths.length, 21);
            assert.equal(interactionProtocol.commandPaths.length, 0);
        });

        it("Root with Light endpoint in InteractionServer", () => {
            const basicInformationCluster = new ClusterServer(BasicInformationCluster, {}, {
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
            }, {});

            const onOffServer = new ClusterServer(
                OnOffCluster,
                { lightingLevelControl: false },
                { onOff: false },
                OnOffClusterHandler()
            );

            const interactionProtocol = new InteractionServer()
                .addEndpoint(0x00, DEVICE.ROOT, [basicInformationCluster,])
                .addEndpoint(0x01, DEVICE.ON_OFF_LIGHT, [ onOffServer ])
            ;

            assert.equal(interactionProtocol.endpoints.size, 2);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.size, 2);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(interactionProtocol.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);
            assert.equal(interactionProtocol.endpoints.get(1)?.clusters.size, 2);
            assert.equal(interactionProtocol.endpoints.get(1)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(interactionProtocol.endpoints.get(1)?.clusters.has(OnOffCluster.id), true);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = interactionProtocol.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.get(), [new EndpointNumber(1)]);

            assert.equal(interactionProtocol.attributePaths.length, 30);
            assert.equal(interactionProtocol.commandPaths.length, 3);
        });
    });
});
