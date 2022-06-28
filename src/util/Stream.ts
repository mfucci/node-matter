export const END_OF_STREAM = "EoS";

export interface Stream<T> {
    read(): Promise<T>;
    write(data: T): Promise<void>;
}