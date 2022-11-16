/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    ArrayT,
    BooleanT,
    Field,
    OptionalField,
    ObjectT,
    StringT,
    UInt8T,
    UInt16T,
    UInt32T,
    Bound,
    EnumT, BitMapT, Bit, AnyT
} from "../../codec/TlvObjectCodec";
import { Attribute, OptionalAttribute, Cluster, Command, OptionalCommand, NoResponseT } from "./Cluster";
import { StatusCode } from "../interaction/InteractionMessages";
import { GroupIdT } from "../common/GroupId";
import { ClusterIdT } from "../common/ClusterId";
import { NodeIdT } from "../common/NodeId";
import { AttributeIdT } from "../common/AttributeId";
import { MatterApplicationClusterSpecificationV1_0 } from "../../Specifications";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.6.1 */
const AttributeValuePairT = ObjectT({
    /**
     * This field SHALL be present or not present, for all instances in the Scenes cluster. If this field is
     * not present, then the data type of AttributeValue SHALL be determined by the order and data type defined
     * in the cluster specification. Otherwise the data type of AttributeValue SHALL be the data type of the
     * attribute indicated by AttributeID.
     */
    attributeId: Field(0, AttributeIdT),

    /** This is the attribute value as part of an extension field set. */
    attributeValue: Field(1, ArrayT(AnyT)),
});

/**
 * This data type indicates for a given cluster a set of attributes and their values. Only attributes which
 * have the "S" designation in the Quality column of the cluster specification SHALL be used in the
 * AttributeValueList field.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.6.2
 */
export const ExtensionFieldSetT = ObjectT({
    clusterId: Field(0, ClusterIdT),
    attributeValueList: Field(1, ArrayT(AttributeValuePairT)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.2 and 1.4.9.9 */
const AddSceneRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
    sceneId: Field(1, UInt8T),
    transitionTime: Field(2, UInt16T),
    sceneName: Field(3, StringT( { maxLength: 16 })),
    extensionFieldSets: Field(4, ArrayT(ExtensionFieldSetT)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.3 and § 1.4.9.10 */
const ViewSceneRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
    sceneId: Field(1, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.4 */
const RemoveSceneRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
    sceneId: Field(1, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.5 */
const RemoveAllScenesRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.6 */
const StoreSceneRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
    sceneId: Field(1, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.7 */
const RecallSceneRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
    sceneId: Field(1, UInt8T),
    transitionTime: OptionalField(2, UInt16T), /* nullable: true */
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.8 */
const GetSceneMembershipRequestT = ObjectT({
    groupId: Field(0, GroupIdT),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.11.1 */
const ScenesCopyModeT = BitMapT({
    copyAllScenes: Bit(0),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.11 */
const CopySceneRequestT = ObjectT({
    /** Contains information of how the scene copy is to proceed. Bitmap: see 1.4.9.11.1 */
    mode: Field(0, ScenesCopyModeT),
    /** Specifies the identifier of the group from which the scene is to be copied. */
    groupIdFrom: Field(1, GroupIdT),
    /** Specifies the identifier of the scene from which the scene is to be copied. */
    sceneIdFrom: Field(2, UInt8T),
    /** Specifies the identifier of the group to which the scene is to be copied. */
    groupIdTo: Field(3, GroupIdT),
    /** Specifies the identifier of the scene to which the scene is to be copied. */
    sceneIdTo: Field(4, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.12 and § 1.4.9.18 */
const AddSceneResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT),
    sceneId: Field(2, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.13 */
/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.19 */
const ViewSceneResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT),
    sceneId: Field(2, UInt8T),
    transitionTime: OptionalField(3, UInt16T),
    sceneName: OptionalField(4, StringT( { maxLength: 16 })),
    extensionFieldSets: OptionalField(5, ArrayT(ExtensionFieldSetT)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.14 */
const RemoveSceneResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT),
    sceneId: Field(2, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.15 */
const RemoveAllScenesResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.16 */
const StoreSceneResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    groupId: Field(1, GroupIdT),
    sceneId: Field(2, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.17 */
const GetSceneMembershipResponseT = ObjectT({
    status: Field(0, EnumT<StatusCode>()),
    capacity: Field(1, UInt8T), /* nullable: true */
    groupId: Field(2, GroupIdT),
    sceneList: OptionalField(3, ArrayT(UInt8T)),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.20 */
const CopySceneResponseT = ObjectT({
    /** Contains the status of the copy scene attempt. */
    status: Field(0, EnumT<StatusCode>()),
    /** Specifies the identifier of the group from which the scene was copied. */
    groupIdFrom: Field(1, GroupIdT),
    /** Specifies the identifier of the scene from which the scene was copied. */
    sceneIdFrom: Field(2, UInt8T),
});

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.7.5 */
const nameSupportBitmapT = BitMapT({
    sceneNames: Bit(7),
});

/*
  TODO
  * Feature map:
    * Bit 0: Scene Names - The ability to store a name for a scene.
  * Dependencies:
    * Any endpoint that implements the Scenes server cluster SHALL also implement the Groups server cluster.
    * Note that the RemoveGroup command and the RemoveAllGroups command of the Groups cluster also remove scenes.
 */

/*
<bitmap name="SceneFeatures" type="BITMAP32">
<cluster code="0x0006" />
<field name="SceneNames" mask="0x01" />
    </bitmap>
*/

/**
 * From [Matter Application Cluster Specification R1.0], section 1.4
 * The Scenes cluster provides attributes and commands for setting up and recalling scenes.
 * Each scene corresponds to a set of stored values of specified attributes for one or more
 * clusters on the same end point as the Scenes cluster.
 *
 * clusterRevision: 4
 * featureMap: 1 - Bit 0 (Scene Names) is set
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4
 */
export const ScenesCluster = Cluster({
    id: 0x05,
    name: "Scenes",

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.7 */
    attributes: {
        /** Specifies the number of scenes currently in the server’s Scene Table. */
        sceneCount: Attribute(0, UInt8T, { default: 0 }),
        /** Holds the scene identifier of the scene last invoked. */
        currentScene: Attribute(1, UInt8T, { default: 0 }),
        /** Holds the group identifier of the scene last invoked, or 0 if the scene last invoked is not associated with a group. */
        currentGroup: Attribute(2, Bound(UInt16T,{ min: 0, max: 0xfff7 }), { default: 0 }), /* formally type: groupId but limited range */
        /** Indicates whether the state of the server corresponds to that associated with the CurrentScene and CurrentGroup attributes. */
        sceneValid: Attribute(3, BooleanT, { default: false }),
        /**
         * This attribute provides legacy, read-only access to whether the Scene
         * Names feature is supported. The most significant bit, bit 7, SHALL be
         * equal to bit 0 of the FeatureMap attribute. All other bits SHALL be 0.
         *
         * TODO because we (will) support group names we need to set bit 7 to 1, rest is 0
         */
        nameSupport: Attribute(4, nameSupportBitmapT, { default: { sceneNames: true } }),
        /** Holds the Node ID (the IEEE address in case of Zigbee) of the node that last configured the Scene Table. */
        lastConfiguredBy: OptionalAttribute(5, NodeIdT), /* nullable: true */
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9 */
    commands: {
        /**
         * Add a scene to the scene table.
         * Extension field sets are supported, and are inputed as
         * '{"ClusterID": VALUE, "AttributeValueList":[{"AttributeId": VALUE, "AttributeValue": VALUE}]}'
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.2
         */
        addScene: Command(0, AddSceneRequestT, 0, AddSceneResponseT),
        /**
         * Retrieves the requested scene entry from its Scene table.
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.3
         */
        viewScene: Command(1, ViewSceneRequestT, 1, ViewSceneResponseT),
        /**
         * Removes the requested scene entry, corresponding to the value of the GroupID field, from its Scene Table
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.4
         */
        removeScene: Command(2, RemoveSceneRequestT, 2, RemoveSceneResponseT),
        /**
         * Remove all scenes, corresponding to the value of the GroupID field, from its Scene Table
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.5
         */
        removeAllScenes: Command(3, RemoveAllScenesRequestT, 3, RemoveAllScenesResponseT),
        /**
         * Adds the scene entry into its Scene Table along with all extension field sets corresponding to the current
         * state of other clusters on the same endpoint
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.6
         */
        storeScenes: Command(4, StoreSceneRequestT, 4, StoreSceneResponseT),
        /**
         * Set the attributes and corresponding state for each other cluster implemented on the endpoint accordingly to
         * the requested scene entry in the Scene Table
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.7
         */
        recallScene: Command(5, RecallSceneRequestT, 5, NoResponseT),
        /**
         * Get an unused scene identifier when no commissioning tool is in the network, or for a commissioning tool to
         * get the used scene identifiers within a certain group
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.8
         */
        getSceneMembership: Command(6, GetSceneMembershipRequestT, 6, GetSceneMembershipResponseT),
        /**
         * Allows a scene to be added using a finer scene transition time than the AddScene command.
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.9
         */
        enhancedAddScene: OptionalCommand(0x40, AddSceneRequestT, 0x40, AddSceneResponseT),
        /**
         * Allows a scene to be retrieved using a finer scene transition time than the ViewScene command
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.10
         */
        enhancedViewScene: OptionalCommand(0x41, ViewSceneRequestT, 0x41, ViewSceneResponseT),
        /**
         * Allows a client to efficiently copy scenes from one group/scene identifier pair to another group/scene
         * identifier pair.
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.4.9.11
         */
        copyScene: OptionalCommand(0x42, CopySceneRequestT, 0x42, CopySceneResponseT),
    },
});
