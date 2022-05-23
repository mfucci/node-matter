import dgram from 'node:dgram';
import { Channel } from './Channel';
import { Dispatcher } from './Dispatcher';

export class Udp {
    private readonly server = dgram.createSocket('udp4');

    constructor(
        dispatcher: Dispatcher,
        private readonly port: number = 5540,
        ) {
        this.server.on('error', error => console.log(`server error:${error.stack}`));
        this.server.on('message', (message, {address, port}) => dispatcher.onMessage(new UdpChannel(this.server, address, port), message));
    }

    start() {
        this.server.bind(this.port);
    }
}

class UdpChannel implements Channel<Buffer> {
    constructor(
        private readonly server: dgram.Socket,
        private readonly peerIp: string,
        private readonly peerPort: number,
    ) {}


    send(data: Buffer) {
        return new Promise<void>((resolver, rejecter) => {
            this.server.send(data, this.peerPort, this.peerIp, error => {
                if (error !== null) rejecter(error);
                resolver();
            });
        });
    }
}

new Udp(new Dispatcher()).start();
