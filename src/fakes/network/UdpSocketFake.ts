import { UdpSocket, UdpSocketOptions } from "../../io/udp/UdpSocket";
import { NetListener } from "../../net/NetInterface";
import { FakeNetwork } from "./FakeNetwork";

export class UdpSocketFake implements UdpSocket {
    static async create({address, port, multicastInterface}: UdpSocketOptions) {
        if (address === undefined) throw new Error("Device IP address should be specified for fake UdpSocket");
        return new UdpSocketFake(FakeNetwork.get(), address, port, multicastInterface);
    }

    private readonly netListeners = new Array<NetListener>();

    constructor(
        private readonly network: FakeNetwork,
        private readonly address: string,
        private readonly port: number,
        private readonly multicastInterface?: string) {
    }

    onData(listener: (peerAddress: string, peerPort: number, data: Buffer) => void) {
        const netListener = this.network.onUdpData(this.address, this.port, listener);
        this.netListeners.push(netListener);
        return netListener;
    }

    async send(address: string, port: number, data: Buffer) {
        this.network.sendUdp(this.address, this.port, address, port, data);
    }

    close() {
        this.netListeners.forEach(netListener => netListener.close());
        this.netListeners.length = 0;
    }
}
