import { SecureMessageStream } from "./SecureMessageStream";

export class SessionRouter {
    private readonly sessionStreams = new Map<string, SecureMessageStream>();

    routePacket(dataStream: Stream<Buffer>, )

}