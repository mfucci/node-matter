import { MatterDevice } from "../../MatterDevice";
import { SecureSession } from "../../session/SecureSession";
import {
    CommissioningError,
    GeneralCommissioningCluster,
    RegulatoryLocationType
} from "../GeneralCommissioningCluster";
import { ClusterServerHandlers } from "./ClusterServer";

const SuccessResponse = {errorCode: CommissioningError.Ok, debugText: ""};

export const GeneralCommissioningClusterHandler: ClusterServerHandlers<typeof GeneralCommissioningCluster> = {
    armFailSafe: async ({ request: {breadcrumbStep}, attributes: {breadcrumb}, session }) => {
        session.getContext().armFailSafe();
        breadcrumb.set(breadcrumbStep);
        return SuccessResponse;
    },

    setRegulatoryConfig: async ({request: {breadcrumbStep, newRegulatoryConfig, countryCode}, attributes: {breadcrumb, regulatoryConfig, locationCapability}}) => {
        const locationCapabilityValue = locationCapability.get();
        if (locationCapabilityValue !== RegulatoryLocationType.IndoorOutdoor && newRegulatoryConfig !== locationCapabilityValue) {
            return {errorCode: CommissioningError.ValueOutsideRange, debugText: "Invalid regulatory location"};
        }
        if (locationCapabilityValue === RegulatoryLocationType.IndoorOutdoor) {
            regulatoryConfig.set(newRegulatoryConfig);
        }

        // TODO countryCode should be set for the BasicInformationCluster.location!

        breadcrumb.set(breadcrumbStep);
        return SuccessResponse;
    },

    commissioningComplete: async ({session}) => {
        if (!session.isSecure()) throw new Error("commissioningComplete can only be called on a secure session");
        const fabric = (session as SecureSession<MatterDevice>).getFabric();
        if (fabric === undefined) throw new Error("commissioningComplete is called but the fabric has not been defined yet");
        console.log(`Commissioning completed on fabric #${fabric.id} as node #${fabric.nodeId}.`)
        return SuccessResponse;
    },
};
