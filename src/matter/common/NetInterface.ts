import { ExchangeSocket } from "./ExchangeSocket";

export interface NetInterface {
    onData(listener: (socket: ExchangeSocket<Buffer>, data: Buffer) => void): void;
}
