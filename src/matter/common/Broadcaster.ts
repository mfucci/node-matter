import { Fabric } from "../../fabric/Fabric";

export interface Broadcaster {
    setCommissionMode(deviceName: string, deviceType: number, vendorId: number, productId: number, discriminator: number): void;
    setFabric(fabric: Fabric): void;
    announce(): Promise<void>;
}
