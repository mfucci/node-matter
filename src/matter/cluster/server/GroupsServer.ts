/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { GroupsCluster } from "../GroupsCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { StatusCode } from "../../interaction/InteractionMessages";

/*
TODO: Global Cluster fields needs to be added also here because, as discussed, based on the implementation.
* Cluster Revision: 4
* FeatureMap:
  * Bit 0: Group Names - The ability to store a name for a group.
* AttributeList:
  * xxx
* AcceptedCommandList:
  * xxx
* GeneratedCommandList: empty
* EventList: empty
* FabricIndex: empty
 */

/*
TODO: If the Scenes server cluster is implemented on the same endpoint, the following extension field SHALL
      be added to the Scene Table:
      * OnOff
 */

/*
TODO: Is a "groupcast" the groupId range 0xFF00 - 0xFFFF ??
 */

export const GroupsClusterHandler: () => ClusterServerHandlers<typeof GroupsCluster> = () => ({
    // TODO In fact for the Cluster server implementation we need "initialization code" or thinks like this.
    //      I know that it is the wrong place in the "Handlers" object, but I don't know where to put it right now
    //      because it should be "bound to the cluster instance" and not to the "cluster type".
    //      Yes could also be build without the subscriptions, but so the code is separated from the other implementation
    //      parts and if used as library and the "specific device implementation" manipulates onTime or offWaitTime then
    //      it is all handled automatically and pot. not missed.
    constructor: () => {
        // TODO how to "bind this Groups instance to the endpoint? I think relevant when persisting data
        // An Entry here would mean that the endpoint where the cluster is located in belongs to the group!
        this.clusterGroups = new Map<number, string>();

    },
    addGroup: async ({ request: { groupId, groupName } }) => {
        // TODO If the AddGroup command was received as a unicast, the server SHALL generate an AddGroupResponse
        //      command with the Status field set to the evaluated status. If the AddGroup command was received
        //      as a groupcast, the server SHALL NOT generate an AddGroupResponse command.
        if (groupId.id < 1 || groupId.id > 0xFFFF) {
            return {status: StatusCode.ConstraintError, groupId};
        }
        if (groupName.length > 16) {
            return {status: StatusCode.ConstraintError, groupId};
        }
        this.clusterGroups.set(groupId, groupName || '');
        return {status: StatusCode.Success, groupId};
    },
    viewGroup: async ({ request: { groupId } }) => {
        // TODO If the ViewGroup command was received as a unicast, the server SHALL generate an AddGroupResponse
        //      command with the Status field set to the evaluated status. If the AddGroup command was received
        //      as a groupcast, the server SHALL NOT generate an AddGroupResponse command.
        if (groupId.id < 1 || groupId.id > 0xFFFF) {
            return {status: StatusCode.ConstraintError, groupId, groupName: ''};
        }
        if (this.clusterGroups.has(groupId)) {
            return {status: StatusCode.Success, groupId, groupName: this.clusterGroups.get(groupId) || ''};
        }
        return {status: StatusCode.NotFound, groupId, groupName: ''};

    },
    getGroupMembership: async ({ request: { groupList } }) => {
        // TODO Later:
        //  Zigbee: If the total number of groups will cause the maximum payload length of a frame to be exceeded,
        //  then the GroupList field SHALL contain only as many groups as will fit.

        const allGroupsList = Array.from(this.clusterGroups.keys());
        const capacity = allGroupsList.length < 0xff ? 0xFF - allGroupsList.length : 0xfe;
        if (groupList.length === 0) {
            return {capacity, groupList: allGroupsList};
        }
        const filteredGroupsList = groupList.filter(groupId => this.clusterGroups.has(groupId));
        if (filteredGroupsList.length === 0) {
            // TODO the server SHALL only respond in this case if the command is unicast.
            return {capacity, groupList: []};
        } else {
            return {capacity, groupList: filteredGroupsList};
        }
    },
    removeGroup: async ({request: { groupId } }) => {
        if (groupId.id < 1 || groupId.id > 0xFFFF) {
            return {status: StatusCode.ConstraintError, groupId};
        }
        if (this.clusterGroups.has(groupId)) {
            this.clusterGroups.delete(groupId);
            return {status: StatusCode.Success, groupId};
        }
        return {status: StatusCode.NotFound, groupId};
    },
    removeAllGroups: async () => {
        this.clusterGroups.clear();

        // TODO Additionally, if the Scenes cluster is supported on the same endpoint, all scenes, except for scenes
        //      associated with group ID 0, SHALL be removed on that endpoint.

        // TODO If the RemoveAllGroups command was received as unicast and a response is not suppressed ... return Success
        return {status: StatusCode.Success};
    },
    addGroupIfIdentifying: async ({  request: { groupId, groupName } }) => {
        // TODO The server verifies that it is currently identifying itself. If the server it not currently identifying
        //      itself, the status SHALL be SUCCESS
        // return {status: StatusCode.Success, groupId};

        // TODO If the AddGroupIfIdentifying command was received as unicast and the evaluated status is not SUCCESS, or
        //      if the AddGroupIfIdentifying command was received as unicast and the evaluated status is SUCCESS and a
        //      response is not suppressed, the server SHALL generate a response with the Status field set to the
        //      evaluated status.

        return this.addGroup({request: {groupId, groupName}});
    },
});
