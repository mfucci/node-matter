import { ExchangeSocket } from "../matter/common/ExchangeSocket";

export interface NetListener {
    close(): void;
}

export interface NetInterface {
    openChannel(address: string, port: number): Promise<ExchangeSocket<Buffer>>;
    onData(listener: (socket: ExchangeSocket<Buffer>, data: Buffer) => void): NetListener;
}
