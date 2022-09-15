import dgram from "dgram";
import { UdpSocket, UdpSocketOptions } from "./UdpSocket";

function createUdpSocket(address: string | undefined, port: number, options: dgram.SocketOptions) {
    const socket = dgram.createSocket(options);
    return new Promise<dgram.Socket>((resolve, reject) => {
        const handleBindError = (error: Error) => {
            socket.close();
            reject(error);
        };
        socket.on("error", handleBindError);
        socket.bind(port, address, () => {
            socket.removeListener("error", handleBindError);
            socket.on("error", error => console.error(error));
            resolve(socket);
        });
    });
}

export class UdpSocketNode extends UdpSocket{
    static async create({port, address, multicastInterface}: UdpSocketOptions) {
        const socket = await createUdpSocket(address, port, { type: "udp4", reuseAddr: true });
        if (multicastInterface !== undefined) socket.setMulticastInterface(multicastInterface);
        return new UdpSocketNode(socket);
    }

    constructor(private readonly socket: dgram.Socket) {
        super();
    }

    onData(listener: (peerAddress: string, peerPort: number, data: Buffer) => void) {
        const messageListener = (data: Buffer, { address, port }: { address: string, port: number }) => listener(address, port, data);

        this.socket.on("message", messageListener);
        return {
            close: () => {
                this.socket.removeListener("message", messageListener);
            }
        };
    }

    async send(address: string, port: number, data: Buffer) {
        return new Promise<void>((resolve, reject) => {
            this.socket.send(data, port, address, error => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }

    close() {
        this.socket.close();
    }
}
