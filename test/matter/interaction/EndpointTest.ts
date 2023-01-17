import { ClusterServer, pathToId } from "../../../src/matter/interaction/InteractionServer";
import { DEVICE } from "../../../src/matter/common/DeviceTypes";
import { BasicInformationCluster } from "../../../src/matter/cluster/BasicInformationCluster";
import { VendorId } from "../../../src/matter/common/VendorId";
import assert from "assert";
import { AttributeServer } from "../../../src/matter/cluster/server/AttributeServer";
import { EndpointNumber } from "../../../src/matter/common/EndpointNumber";
import { DescriptorCluster } from "../../../src/matter/cluster/DescriptorCluster";
import { OnOffCluster } from "../../../src/matter/cluster/OnOffCluster";
import { OnOffClusterHandler } from "../../../src/matter/cluster/server/OnOffServer";
import { Endpoint } from "../../../src/matter/interaction/Endpoint";
import { BridgedDeviceBasicInformationCluster } from "../../../src/matter/cluster/BridgedDeviceBasicInformationCluster";
import { FixedLabelCluster } from "../../../src/matter/cluster/LabelCluster";

describe("Endpoint", () => {

    context("Endpoint structures", () => {
        it("Simple endpoint", () => {
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

            const rootEndpoint = new Endpoint(0x00, [ DEVICE.ROOT ], [ basicInformationCluster ]);

            assert.equal(rootEndpoint.endpoints.size, 1);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.getLocal(), []);

            assert.equal(rootEndpoint.attributePaths.length, 21);
            assert.equal(rootEndpoint.commandPaths.length, 0);
        });

        it("One device with Light endpoints", () => {
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

            const rootEndpoint = new Endpoint(0x00, [ DEVICE.ROOT ], [ basicInformationCluster ])
                .addEndpoint(0x01, [ DEVICE.ON_OFF_LIGHT ], [ onOffServer ]);

            assert.equal(rootEndpoint.endpoints.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(OnOffCluster.id), true);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.getLocal(), [new EndpointNumber(1)]);

            assert.equal(rootEndpoint.attributePaths.length, 30);
            assert.equal(rootEndpoint.commandPaths.length, 3);
        });

        it("Device Structure with one Light endpoint", () => {
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

            const rootEndpoint = new Endpoint(0, [ DEVICE.ROOT ], [ basicInformationCluster ], [
                new Endpoint(1, [ DEVICE.AGGREGATOR ], [ ])
                    .addEndpoint(11, [ DEVICE.ON_OFF_LIGHT, DEVICE.BRIDGED_DEVICE ], [ onOffServer ]),
            ]);

            assert.equal(rootEndpoint.endpoints.size, 3);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.size, 1);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(OnOffCluster.id), true);

            const aggregatorPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 1, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(aggregatorPartsListAttribute?.getLocal(), [new EndpointNumber(11)]);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.getLocal(), [new EndpointNumber(1), new EndpointNumber(11)]);

            assert.equal(rootEndpoint.attributePaths.length, 36);
            assert.equal(rootEndpoint.commandPaths.length, 3);
        });

        it("Device Structure with one aggregator and two Light endpoints", () => {
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

            const rootEndpoint = new Endpoint(0, [ DEVICE.ROOT ], [ basicInformationCluster ], [
                new Endpoint(1, [ DEVICE.AGGREGATOR ], [ ])
                    .addEndpoint(11, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                        new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                            nodeLabel: "Socket 2",
                            reachable: true
                        }, {}),
                        onOffServer
                    ])
                    .addEndpoint(12, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                        new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                            nodeLabel: "Socket 2",
                            reachable: true
                        }, {}),
                        onOffServer
                    ]),
            ]);

            assert.equal(rootEndpoint.endpoints.size, 4);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.size, 1);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(OnOffCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(OnOffCluster.id), true);

            const aggregatorPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 1, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(aggregatorPartsListAttribute?.getLocal(), [new EndpointNumber(11), new EndpointNumber(12)]);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.getLocal(), [new EndpointNumber(1), new EndpointNumber(11), new EndpointNumber(12)]);

            assert.equal(rootEndpoint.attributePaths.length, 53);
            assert.equal(rootEndpoint.commandPaths.length, 6);
        });

        it("Device Structure with two aggregators and two Light endpoints", () => {
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

            const rootEndpoint = new Endpoint(0, [ DEVICE.ROOT ], [ basicInformationCluster ], [
                new Endpoint(1, [ DEVICE.AGGREGATOR ], [
                    new ClusterServer(FixedLabelCluster, {}, {
                        labelList: [ { label: "bridge", value: "Type A" } ]
                    }, {}),
                ])
                .addEndpoint(11, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                    new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                        nodeLabel: "Socket 1-1",
                        reachable: true
                    }, {}),
                    onOffServer
                ])
                .addEndpoint(12, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                    new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                        nodeLabel: "Socket 1-2",
                        reachable: true
                    }, {}),
                    onOffServer
                ]),
                new Endpoint(2, [ DEVICE.AGGREGATOR ], [
                    new ClusterServer(FixedLabelCluster, {}, {
                        labelList: [ { label: "bridge", value: "Type B" } ]
                    }, {}),
                ])
                .addEndpoint(21, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                    new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                        nodeLabel: "Socket 2-1",
                        reachable: true
                    }, {}),
                    onOffServer
                ])
                .addEndpoint(22, [ DEVICE.ON_OFF_PLUGIN_UNIT, DEVICE.BRIDGED_DEVICE ], [
                    new ClusterServer(BridgedDeviceBasicInformationCluster, {}, {
                        nodeLabel: "Socket 2-2",
                        reachable: true
                    }, {}),
                    onOffServer
                ]),
            ]);

            assert.equal(rootEndpoint.endpoints.size, 7);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(0)?.clusters.has(BasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(FixedLabelCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(2)?.clusters.size, 2);
            assert.equal(rootEndpoint.endpoints.get(2)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(1)?.clusters.has(FixedLabelCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(11)?.clusters.has(OnOffCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(12)?.clusters.has(OnOffCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(21)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(21)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(21)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(21)?.clusters.has(OnOffCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(22)?.clusters.size, 3);
            assert.equal(rootEndpoint.endpoints.get(22)?.clusters.has(DescriptorCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(22)?.clusters.has(BridgedDeviceBasicInformationCluster.id), true);
            assert.equal(rootEndpoint.endpoints.get(22)?.clusters.has(OnOffCluster.id), true);

            const aggregator1PartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 1, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(aggregator1PartsListAttribute?.getLocal(), [new EndpointNumber(11), new EndpointNumber(12)]);

            const aggregator2PartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 2, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(aggregator2PartsListAttribute?.getLocal(), [new EndpointNumber(21), new EndpointNumber(22)]);

            const rootPartsListAttribute: AttributeServer<EndpointNumber[]> | undefined = rootEndpoint.attributes.get(pathToId({endpointId: 0, clusterId: DescriptorCluster.id, id: DescriptorCluster.attributes.partsList.id}));
            assert.deepEqual(rootPartsListAttribute?.getLocal(), [new EndpointNumber(1), new EndpointNumber(11), new EndpointNumber(12), new EndpointNumber(2), new EndpointNumber(21), new EndpointNumber(22)]);

            assert.equal(rootEndpoint.attributePaths.length, 91);
            assert.equal(rootEndpoint.commandPaths.length, 12);
        });
    });
});
