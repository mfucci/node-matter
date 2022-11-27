/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Attribute, OptionalAttribute, Cluster, Command, OptionalCommand, TlvNoResponse } from "./Cluster";
import { StatusCode } from "../interaction/InteractionMessages";
import { TlvGroupId } from "../common/GroupId";
import { TlvClusterId } from "../common/ClusterId";
import { TlvNodeId } from "../common/NodeId";
import { TlvAttributeId } from "../common/AttributeId";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvAny, TlvArray, TlvBitmap, TlvBoolean, TlvEnum, TlvField, TlvNullable, TlvObject, TlvOptionalField, TlvString, TlvUInt16, TlvUInt8 } from "@project-chip/matter.js";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.6.1 */
const TlvAttributeValuePair = TlvObject({
    /**
     * This field SHALL be present or not present, for all instances in the Scenes cluster. If this field is
     * not present, then the data type of AttributeValue SHALL be determined by the order and data type defined
     * in the cluster specification. Otherwise the data type of AttributeValue SHALL be the data type of the
     * attribute indicated by AttributeID.
     */
    attributeId: TlvField(0, TlvAttributeId),

    /** This is the attribute value as part of an extension field set. */
    attributeValue: TlvField(1, TlvArray(TlvAny)),
});

/**
 * This data type indicates for a given cluster a set of attributes and their values. Only attributes which
 * have the "S" designation in the Quality column of the cluster specification SHALL be used in the
 * AttributeValueList field.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.6.2
 */
export const TlvExtensionFieldSet = TlvObject({
    clusterId: TlvField(0, TlvClusterId),
    attributeValueList: TlvField(1, TlvArray(TlvAttributeValuePair)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.2 and 1.4.9.9 */
const TlvAddSceneRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
    sceneId: TlvField(1, TlvUInt8),
    transitionTime: TlvField(2, TlvUInt16),
    sceneName: TlvField(3, TlvString.bound( { maxLength: 16 })),
    extensionFieldSets: TlvField(4, TlvArray(TlvExtensionFieldSet)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.3 and § 1.4.9.10 */
const TlvViewSceneRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
    sceneId: TlvField(1, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.4 */
const TlvRemoveSceneRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
    sceneId: TlvField(1, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.5 */
const TlvRemoveAllScenesRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.6 */
const TlvStoreSceneRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
    sceneId: TlvField(1, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.7 */
const TlvRecallSceneRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
    sceneId: TlvField(1, TlvUInt8),
    transitionTime: TlvOptionalField(2, TlvNullable(TlvUInt16)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.8 */
const TlvGetSceneMembershipRequest = TlvObject({
    groupId: TlvField(0, TlvGroupId),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.11.1 */
const TlvScenesCopyMode = TlvBitmap(TlvUInt8, {
    copyAllScenes: BitFlag(0),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.11 */
const TlvCopySceneRequest = TlvObject({
    /** Contains information of how the scene copy is to proceed. Bitmap: see 1.4.9.11.1 */
    mode: TlvField(0, TlvScenesCopyMode),

    /** Specifies the identifier of the group from which the scene is to be copied. */
    groupIdFrom: TlvField(1, TlvGroupId),

    /** Specifies the identifier of the scene from which the scene is to be copied. */
    sceneIdFrom: TlvField(2, TlvUInt8),

    /** Specifies the identifier of the group to which the scene is to be copied. */
    TlvGroupIdo: TlvField(3, TlvGroupId),

    /** Specifies the identifier of the scene to which the scene is to be copied. */
    sceneIdTo: TlvField(4, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.12 and § 1.4.9.18 */
const TlvAddSceneResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    groupId: TlvField(1, TlvGroupId),
    sceneId: TlvField(2, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.13 and § 1.4.9.19 */
const TlvViewSceneResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    groupId: TlvField(1, TlvGroupId),
    sceneId: TlvField(2, TlvUInt8),
    transitionTime: TlvOptionalField(3, TlvUInt16),
    sceneName: TlvOptionalField(4, TlvString.bound( { maxLength: 16 })),
    extensionFieldSets: TlvOptionalField(5, TlvArray(TlvExtensionFieldSet)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.14 */
const TlvRemoveSceneResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    groupId: TlvField(1, TlvGroupId),
    sceneId: TlvField(2, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.15 */
const TlvRemoveAllScenesResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    groupId: TlvField(1, TlvGroupId),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.16 */
const TlvStoreSceneResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    groupId: TlvField(1, TlvGroupId),
    sceneId: TlvField(2, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.17 */
const TlvGetSceneMembershipResponse = TlvObject({
    status: TlvField(0, TlvEnum<StatusCode>()),
    capacity: TlvField(1, TlvNullable(TlvUInt8)),
    groupId: TlvField(2, TlvGroupId),
    sceneList: TlvOptionalField(3, TlvArray(TlvUInt8)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.20 */
const TlvCopySceneResponse = TlvObject({
    /** Contains the status of the copy scene attempt. */
    status: TlvField(0, TlvEnum<StatusCode>()),

    /** Specifies the identifier of the group from which the scene was copied. */
    groupIdFrom: TlvField(1, TlvGroupId),

    /** Specifies the identifier of the scene from which the scene was copied. */
    sceneIdFrom: TlvField(2, TlvUInt8),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.7.5 */
const TlvNameSupportBitmap = TlvBitmap(TlvUInt8, {
    sceneNames: BitFlag(7),
});

/**
 * The Scenes cluster provides attributes and commands for setting up and recalling scenes.
 * Each scene corresponds to a set of stored values of specified attributes for one or more
 * clusters on the same end point as the Scenes cluster.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4
 */
export const ScenesCluster = Cluster({
    id: 0x05,
    name: "Scenes",
    revision: 4,
    features: {
        /** The ability to store a name for a scene. */
        sceneNames: BitFlag(0), 
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.7 */
    attributes: {
        /** Specifies the number of scenes currently in the server’s Scene Table. */
        sceneCount: Attribute(0, TlvUInt8, { default: 0 }),

        /** Holds the scene identifier of the scene last invoked. */
        currentScene: Attribute(1, TlvUInt8, { default: 0 }),

        /** Holds the group identifier of the scene last invoked, or 0 if the scene last invoked is not associated with a group. */
        currentGroup: Attribute(2, TlvUInt16.bound({ min: 0, max: 0xfff7 }), { default: 0 }), /* formally type: groupId but limited range */

        /** Indicates whether the state of the server corresponds to that associated with the CurrentScene and CurrentGroup attributes. */
        sceneValid: Attribute(3,  TlvBoolean, { default: false }),

        /**
         * This attribute provides legacy, read-only access to whether the Scene
         * Names feature is supported. The most significant bit, bit 7, SHALL be
         * equal to bit 0 of the FeatureMap attribute. All other bits SHALL be 0.
         *
         * TODO because we (will) support group names we need to set bit 7 to 1, rest is 0
         */
        nameSupport: Attribute(4, TlvNameSupportBitmap, { default: { sceneNames: true } }),

        /** Holds the Node ID (the IEEE address in case of Zigbee) of the node that last configured the Scene Table. */
        lastConfiguredBy: OptionalAttribute(5, TlvNullable(TlvNodeId)),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9 */
    commands: {
        /**
         * Add a scene to the scene table.
         * Extension field sets are supported, and are inputed as
         * '{"ClusterID": VALUE, "AttributeValueList":[{"AttributeId": VALUE, "AttributeValue": VALUE}]}'
         */
        addScene: Command(0, TlvAddSceneRequest, 0, TlvAddSceneResponse),

        /**
         * Retrieves the requested scene entry from its Scene table.
         */
        viewScene: Command(1, TlvViewSceneRequest, 1, TlvViewSceneResponse),

        /**
         * Removes the requested scene entry, corresponding to the value of the GroupID field, from its Scene Table
         */
        removeScene: Command(2, TlvRemoveSceneRequest, 2, TlvRemoveSceneResponse),

        /**
         * Remove all scenes, corresponding to the value of the GroupID field, from its Scene Table
         */
        removeAllScenes: Command(3, TlvRemoveAllScenesRequest, 3, TlvRemoveAllScenesResponse),

        /**
         * Adds the scene entry into its Scene Table along with all extension field sets corresponding to the current
         * state of other clusters on the same endpoint
         */
        storeScenes: Command(4, TlvStoreSceneRequest, 4, TlvStoreSceneResponse),

        /**
         * Set the attributes and corresponding state for each other cluster implemented on the endpoint accordingly to
         * the requested scene entry in the Scene Table
         */
        recallScene: Command(5, TlvRecallSceneRequest, 5, TlvNoResponse),

        /**
         * Get an unused scene identifier when no commissioning tool is in the network, or for a commissioning tool to
         * get the used scene identifiers within a certain group
         */
        getSceneMembership: Command(6, TlvGetSceneMembershipRequest, 6, TlvGetSceneMembershipResponse),

        /**
         * Allows a scene to be added using a finer scene transition time than the AddScene command.
         */
        enhancedAddScene: OptionalCommand(0x40, TlvAddSceneRequest, 0x40, TlvAddSceneResponse),

        /**
         * Allows a scene to be retrieved using a finer scene transition time than the ViewScene command
         */
        enhancedViewScene: OptionalCommand(0x41, TlvViewSceneRequest, 0x41, TlvViewSceneResponse),

        /**
         * Allows a client to efficiently copy scenes from one group/scene identifier pair to another group/scene
         * identifier pair.
         */
        copyScene: OptionalCommand(0x42, TlvCopySceneRequest, 0x42, TlvCopySceneResponse),
    },
});
