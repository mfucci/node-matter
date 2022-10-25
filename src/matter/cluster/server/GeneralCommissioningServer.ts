/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from "../../../log/Logger";
import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import {
    CommissioningError,
    GeneralCommissioningCluster,
    RegulatoryLocationType
} from "../GeneralCommissioningCluster";
import { ClusterServerHandlers } from "./ClusterServer";

const SuccessResponse = {errorCode: CommissioningError.Ok, debugText: ""};
const logger = Logger.get("GeneralCommissioningClusterHandler");

export const GeneralCommissioningClusterHandler: ClusterServerHandlers<typeof GeneralCommissioningCluster> = {
    armFailSafe: async ({ request: {breadcrumbStep}, attributes: {breadcrumb}, session }) => {
        session.getContext().armFailSafe();
        breadcrumb.set(breadcrumbStep);
        return SuccessResponse;
    },

    setRegulatoryConfig: async ({request: {breadcrumbStep, newRegulatoryConfig, countryCode}, attributes: {breadcrumb, regulatoryConfig, locationCapability}}) => {
        const locationCapabilityValue = locationCapability.get();

        let validValues;
        switch (locationCapabilityValue) {
            case (RegulatoryLocationType.Outdoor):
                validValues = [RegulatoryLocationType.Outdoor];
                break;
            case (RegulatoryLocationType.Indoor):
                validValues = [RegulatoryLocationType.Indoor];
                break;
            case (RegulatoryLocationType.IndoorOutdoor):
                validValues = [RegulatoryLocationType.Indoor, RegulatoryLocationType.Outdoor];
                break;
            default:
                return {errorCode: CommissioningError.ValueOutsideRange, debugText: "Invalid regulatory location"};
        }

        regulatoryConfig.set(newRegulatoryConfig);

        // TODO countryCode should be set for the BasicCluster.location!

        breadcrumb.set(breadcrumbStep);
        return SuccessResponse;
    },

    commissioningComplete: async ({session}) => {
        if (!session.isSecure()) throw new Error("commissioningComplete can only be called on a secure session");
        const fabric = (session as SecureSession<MatterDevice>).getFabric();
        if (fabric === undefined) throw new Error("commissioningComplete is called but the fabric has not been defined yet");
        logger.info(`Commissioning completed on fabric #${fabric.id} as node #${fabric.nodeId}.`)
        return SuccessResponse;
    },
};
