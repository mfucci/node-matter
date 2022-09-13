export interface UdpSocketOptions {
    port: number,
    address?: string,
    multicastInterface?: string,
}

export abstract class UdpSocket {
    static create: (options: UdpSocketOptions) => Promise<UdpSocket> = () => { throw new Error("No provider configured"); };

    abstract onMessage(listener: (peerAddress: string, peerPort: number, data: Buffer) => void): void;
    abstract send(address: string, port: number, data: Buffer): Promise<void>;
}
