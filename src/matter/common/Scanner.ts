export type MatterDevice = {
    ip: string,
    port: number,
};

export interface Scanner {
    lookForDevice(operationalId: Buffer, nodeId: bigint): Promise<MatterDevice | undefined>;
    close(): void;
}
