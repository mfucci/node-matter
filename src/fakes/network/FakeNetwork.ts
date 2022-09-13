import { singleton } from "../../util/Singleton";

export type Listener = (peerAddress: string, peerPort: number, data: Buffer) => void;

export class FakeNetwork {
    static get = singleton(() => new FakeNetwork());

    private readonly listenersMap = new Map<string, Array<Listener>>();

    onUdpData(address: string, port: number, listener: Listener) {
        const ipPort = `${address}:${port}`;
        var listeners = this.listenersMap.get(ipPort);
        if (listeners === undefined) {
            listeners = new Array<Listener>();
            this.listenersMap.set(ipPort, listeners);
        }
        listeners.push(listener);
    }

    async sendUdp(localAddress: string, localPort: number, remoteAddress: string, remotePort: number, data: Buffer) {
        const ipPort = `${remoteAddress}:${remotePort}`;
        this.listenersMap.get(ipPort)?.forEach(listener => listener(localAddress, localPort, data));
    }
}
