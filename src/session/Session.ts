import { Message, Packet } from "../codec/MessageCodec";
import { Fabric } from "../fabric/Fabric";
import { MatterServer } from "../matter/MatterServer";

export const DEFAULT_IDLE_RETRANSMISSION_TIMEOUT_MS = 5000;
export const DEFAULT_ACTIVE_RETRANSMISSION_TIMEOUT_MS = 300;
export const DEFAULT_RETRANSMISSION_RETRIES = 2;

interface MrpParameters {
    idleRetransmissionTimeoutMs: number,
    activeRetransmissionTimeoutMs: number,
    retransmissionRetries: number,
}

export interface Session {
    isSecure(): boolean;
    getName(): string;
    decode(packet: Packet): Message;
    encode(message: Message): Packet;
    getAttestationChallengeKey(): Buffer;
    setFabric(fabric: Fabric): void;
    getMrpParameters(): MrpParameters;
    getServer(): MatterServer;
    getId(): number;
    getPeerSessionId(): number;
    getNodeId(): bigint | undefined;
    getPeerNodeId(): bigint | undefined;
}
