
export interface ExchangeSocket<T> {
    send(data: T): Promise<void>;
    getName(): string;
}
