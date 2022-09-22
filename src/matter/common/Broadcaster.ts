export interface Broadcaster {
    setCommissionMode(deviceName: string, deviceType: number, vendorId: number, productId: number, discriminator: number): void;
    setFabric(operationalId: Buffer, nodeId: bigint): void;
    announce(): Promise<void>;
    close(): void;
}
