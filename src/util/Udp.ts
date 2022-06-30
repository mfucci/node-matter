import dgram from "dgram";
import { Queue } from "./Queue";
import { Stream } from "./Stream";

export class UdpServerSocket {

    static async create(port: number, connectListener: (socket: UdpSocket) => void) {
        const socket = dgram.createSocket("udp4");
        return new Promise<UdpServerSocket>((resolve, reject) => {
            const handleBindError = (error: Error) => {
                socket.close();
                reject(error);
            };
            socket.on("error", handleBindError);
            socket.bind(port, () => {
                socket.removeListener("error", handleBindError);
                socket.on("error", error => console.log(error));
                resolve(new UdpServerSocket(socket, connectListener));
            });
        })
    }

    private readonly sockets = new Map<string, UdpSocket>();

    private constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly connectListener: (socket: UdpSocket) => void,
    ) {
        dgramSocket.on("message", (message, {address, port}) => this.onMessage(message, address, port));
    }

    private onMessage(message: Buffer, peerAddress: string, peerPort: number) {
        const socketId = `${peerAddress}:${peerPort}`;
        let socket = this.sockets.get(socketId);
        if (socket === undefined) {
            socket = new UdpSocket(this.dgramSocket, socketId, peerAddress, peerPort, () => this.sockets.delete(socketId));
            this.sockets.set(socketId, socket);
            this.connectListener(socket);
        }
        socket.onMessage(message);
    }
}

export class UdpSocket implements Stream<Buffer> {
    private readonly receivedMessages = new Queue<Buffer>();

    constructor(
        private readonly dgramSocket: dgram.Socket,
        private readonly id: string,
        private readonly peerAddress: string,
        private readonly peerPort: number,
        private readonly closeCallback: () => void,
    ) {}

    onMessage(message: Buffer) {
        this.receivedMessages.write(message);
    }

    async read(): Promise<Buffer> {
        return this.receivedMessages.read();
    }

    async write(message: Buffer) {
        return new Promise<void>((resolve, reject) => {
            this.dgramSocket.send(message, this.peerPort, this.peerAddress, error => {
                if (error !== null) {
                    reject(error);
                    return;
                }
                resolve();
            });
        })
    }

    close() {
        this.closeCallback();
    }

    toString() {
        return `udp://${this.id}`;
    }
}

export class UdpBroadcastServer {
    static async create(address: string, port: number, messageListener: (message: Buffer) => void) {
        const socket = dgram.createSocket({type: "udp4", reuseAddr: true});
        return new Promise<UdpBroadcastServer>((resolve, reject) => {
            const handleBindError = (error: Error) => {
                socket.close();
                reject(error);
            };
            socket.on("error", handleBindError);
            socket.bind(port, address, () => {
                socket.removeListener("error", handleBindError);
                socket.on("error", error => console.log(error));
                socket.setBroadcast(true);
                socket.on("message", message => messageListener(message));
                resolve(new UdpBroadcastServer(socket));
            });
        })
    }

    private constructor(
        private readonly dgramSocket: dgram.Socket,
    ) {}

    broadcast(message: Buffer) {
        this.dgramSocket.send(message);
    }
}
