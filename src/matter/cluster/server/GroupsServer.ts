/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GroupsCluster, TlvAddGroupResponse } from "../GroupsCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { StatusCode } from "../../interaction/InteractionMessages";
import { GroupId } from "../../common/GroupId.js";
import { ObjectSchema } from "@project-chip/matter.js";
import {SessionType} from "../../../codec/MessageCodec";
import {StatusResponseError} from "../../interaction/InteractionMessenger";
import {FabricIndex} from "../../common/FabricIndex";
import {Session} from "../../session/Session";
import {MatterDevice} from "../../MatterDevice";
import {SecureSession} from "../../session/SecureSession";
import {Fabric} from "../../fabric/Fabric";

/*
TODO: If the Scenes server cluster is implemented on the same endpoint, the following extension field SHALL
      be added to the Scene Table:
      * OnOff
 */

// TODO Put in a more central place once used by other clusters
const getFabricFromSession = (session: SecureSession<MatterDevice>): Fabric => {
    if (!session.isSecure()) throw new Error("Session needs to be a secure session");
    const fabric = session.getFabric();
    if (fabric === undefined) throw new Error("Session needs to have an associated Fabric");
    return fabric;
}

export const GroupsClusterHandler: () => ClusterServerHandlers<typeof GroupsCluster> = () => {
    const addGroupLogic = (groupId: GroupId, groupName: string, sessionType: SessionType, fabric: Fabric) => {
        // TODO If the AddGroup command was received as a unicast, the server SHALL generate an AddGroupResponse
        //      command with the Status field set to the evaluated status. If the AddGroup command was received
        //      as a groupcast, the server SHALL NOT generate an AddGroupResponse command.
        if (sessionType !== SessionType.Unicast) {
            throw new Error("Groupcast not supported");
        }
        if (groupId.id < 1) {
            return { status: StatusCode.ConstraintError, groupId };
        }
        if (groupName.length > 16) {
            return { status: StatusCode.ConstraintError, groupId };
        }

        let fabricGroups = fabric.getScopedClusterDataInstance<Map<number, string>>(GroupsCluster.id);
        if (fabricGroups === undefined) {
            fabricGroups = new Map();
            fabric.setScopedClusterDataInstance(GroupsCluster.id, fabricGroups);
        }

        fabricGroups.set(groupId.id, groupName || '');

        return { status: StatusCode.Success, groupId };
    }

    return {
        addGroup: async ({ request: { groupId, groupName }, session, message: { packetHeader: { sessionType }} }) => {
            return addGroupLogic(groupId, groupName, sessionType, getFabricFromSession(session as SecureSession<MatterDevice>));
        },

        viewGroup: async ({ request: { groupId }, session, message: { packetHeader: { sessionType } } }) => {
            // TODO If the ViewGroup command was received as a unicast, the server SHALL generate an ViewGroupResponse
            //      command with the Status field set to the evaluated status. If the ViewGroup command was received
            //      as a groupcast, the server SHALL NOT generate an ViewGroupResponse command.
            if (sessionType !== SessionType.Unicast) {
                throw new Error("Groupcast not supported");
            }
            if (groupId.id < 1) {
                return { status: StatusCode.ConstraintError, groupId, groupName: '' };
            }

            const fabric = getFabricFromSession(session as SecureSession<MatterDevice>)
            let fabricGroups = fabric.getScopedClusterDataInstance<Map<number, string>>(GroupsCluster.id);
            if (fabricGroups !== undefined && fabricGroups.get(groupId.id)) {
                return { status: StatusCode.Success, groupId, groupName: fabricGroups.get(groupId.id) || '' };
            }
            return { status: StatusCode.NotFound, groupId, groupName: '' };
        },

        getGroupMembership: async ({ request: { groupList }, session, message: { packetHeader: { sessionType } } }) => {
            // TODO Later:
            //  Zigbee: If the total number of groups will cause the maximum payload length of a frame to be exceeded,
            //  then the GroupList field SHALL contain only as many groups as will fit.

            // TODO the server SHALL only respond in this case if the command is unicast.
            if (sessionType !== SessionType.Unicast) {
                throw new Error("Groupcast not supported");
            }

            const fabric = getFabricFromSession(session as SecureSession<MatterDevice>)
            let fabricGroups = fabric.getScopedClusterDataInstance<Map<number, string>>(GroupsCluster.id);
            if (fabricGroups !== undefined) {
                const allGroupsList = Array.from(fabricGroups.keys());
                const capacity = allGroupsList.length < 0xff ? 0xff - allGroupsList.length : 0xfe;
                if (groupList.length === 0) {
                    return { capacity, groupList: allGroupsList.map(id => new GroupId(id)) };
                }
                const filteredGroupsList = groupList.filter(groupId => fabricGroups.has(groupId.id));
                if (filteredGroupsList.length === 0) {
                    return { capacity, groupList: [] };
                } else {
                    return { capacity, groupList: filteredGroupsList };
                }
            } else {
                return { capacity: 0xff, groupList: [] };
            }
        },

        removeGroup: async ({ request: { groupId }, session, message: { packetHeader: { sessionType } } }) => {
            // TODO If the RemoveGroup command was received as a unicast, the server SHALL generate a RemoveGroupResponse
            //      command with the Status field set to the evaluated status. If the RemoveGroup command was received as
            //      a groupcast, the server SHALL NOT generate a RemoveGroupResponse command.
            if (sessionType !== SessionType.Unicast) {
                throw new Error("Groupcast not supported");
            }

            if (groupId.id < 1) {
                return { status: StatusCode.ConstraintError, groupId };
            }

            const fabric = getFabricFromSession(session as SecureSession<MatterDevice>)
            let fabricGroups = fabric.getScopedClusterDataInstance<Map<number, string>>(GroupsCluster.id);

            if (fabricGroups !== undefined && fabricGroups.has(groupId.id)) {
                fabricGroups.delete(groupId.id);
                return { status: StatusCode.Success, groupId };
            }
            return { status: StatusCode.NotFound, groupId };
        },

        removeAllGroups: async ({ session, message: { packetHeader: { sessionType } } }) => {
            // TODO Additionally, if the Scenes cluster is supported on the same endpoint, all scenes, except for scenes
            //      associated with group ID 0, SHALL be removed on that endpoint.

            // TODO If the RemoveAllGroups command was received as unicast and a response is not suppressed ... return Success
            if (sessionType !== SessionType.Unicast) {
                throw new Error("Groupcast not supported");
            }

            const fabric = getFabricFromSession(session as SecureSession<MatterDevice>)
            let fabricGroups = fabric.getScopedClusterDataInstance<Map<number, string>>(GroupsCluster.id);
            fabricGroups.clear();

            throw new StatusResponseError("Return Status", StatusCode.Success);
        },

        addGroupIfIdentifying: async ({ request: { groupId, groupName }, session, message: { packetHeader: { sessionType }} }) => {
            // TODO The server verifies that it is currently identifying itself. If the server it not currently identifying
            //      itself, the status SHALL be SUCCESS
            // return {status: StatusCode.Success, groupId};

            // TODO If the AddGroupIfIdentifying command was received as unicast and the evaluated status is not SUCCESS, or
            //      if the AddGroupIfIdentifying command was received as unicast and the evaluated status is SUCCESS and a
            //      response is not suppressed, the server SHALL generate a response with the Status field set to the
            //      evaluated status.
            const { status } = addGroupLogic(groupId, groupName, sessionType, getFabricFromSession(session as SecureSession<MatterDevice>));
            throw new StatusResponseError("Return Status", status);
        },
    }
};
