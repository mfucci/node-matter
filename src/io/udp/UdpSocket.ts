import { NetListener } from "../../net/NetInterface";

export interface UdpSocketOptions {
    port: number,
    address?: string,
    multicastInterface?: string,
}

export abstract class UdpSocket {
    static create: (options: UdpSocketOptions) => Promise<UdpSocket> = () => { throw new Error("No provider configured"); };

    abstract onData(listener: (peerAddress: string, peerPort: number, data: Buffer) => void): NetListener;
    abstract send(address: string, port: number, data: Buffer): Promise<void>;
    abstract close(): void;
}
