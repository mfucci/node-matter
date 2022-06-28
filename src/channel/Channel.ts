import { Stream } from "../util/Stream";


export interface Channel {
    bind(listener: (socket: Stream<Buffer>) => void): Promise<void>;
}
