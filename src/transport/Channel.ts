export interface Channel<T> {
    send(data: T): Promise<void>;
}
