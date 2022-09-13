import { UdpSocket, UdpSocketOptions } from "../../io/udp/UdpSocket";
import { FakeNetwork } from "./FakeNetwork";

export class UdpSocketFake implements UdpSocket {
    static async create({address, port, multicastInterface}: UdpSocketOptions) {
        if (address === undefined) throw new Error("Device IP address should be specified for fake UdpSocket");
        return new UdpSocketFake(FakeNetwork.get(), address, port, multicastInterface);
    }

    constructor(
        private readonly network: FakeNetwork,
        private readonly address: string,
        private readonly port: number,
        private readonly multicastInterface?: string) {
    }

    onMessage(listener: (peerAddress: string, peerPort: number, data: Buffer) => void) {
        this.network.onUdpData(this.address, this.port, listener);
    }

    async send(address: string, port: number, data: Buffer) {
        this.network.sendUdp(this.address, this.port, address, port, data);
    }
}
