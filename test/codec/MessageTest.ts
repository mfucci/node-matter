import assert from "assert";
import ByteBuffer from "bytebuffer";
import { MessageCodec, Packet } from "../../src/codec/Message";

const ENCODED = ByteBuffer.fromHex("04 00 00 00 0a 4f f2 17 7e a0 c8 a7 cb 6a 63 52 05 20 d3 64 00 00 15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 25 02 33 dc 24 03 00 28 04 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer();

const DECODED = {
    packetHeader: {
        sessionId: 0,
        sessionType: 0,
        sourceNodeId: BigInt("5936706156730294398"),
        messageId: 401755914,
        destGroupId: undefined,
        destNodeId: undefined
      },
      payloadHeader: {
        protocolId: 0,
        isInitiatorMessage: true,
        exchangeId: 25811,
        messageType: 0x20,
        requiresAck: true,
        ackedMessageId: undefined
      },
      payload: ByteBuffer.fromHex("15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 25 02 33 dc 24 03 00 28 04 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer(),
};

const ENCODED_2 = ByteBuffer.fromHex("01 00 00 00 21 87 12 79 7e a0 c8 a7 cb 6a 63 52 06 21 d3 64 00 00 0a 4f f2 17 15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 30 02 20 17 83 30 2d 95 a4 a9 fb 0d ec b8 fd d6 56 4b 90 a9 57 68 14 59 ae ee 06 99 61 be a6 1d 7b 24 71 25 03 9d 89 35 04 25 01 e8 03 30 02 20 99 f8 13 dd 41 bd 08 1a 1c 63 e8 11 82 8f 06 62 59 4b ca 89 cd 9d 4e d2 6f 74 27 fd b2 a0 27 36 18 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer();

const DECODED_2 = {
    packetHeader: {
        sessionId: 0,
        sessionType: 0,
        sourceNodeId: undefined,
        messageId: 2031257377,
        destGroupId: undefined,
        destNodeId: BigInt("5936706156730294398")
      },
      payloadHeader: {
        protocolId: 0,
        isInitiatorMessage: false,
        exchangeId: 25811,
        messageType: 0x21,
        requiresAck: true,
        ackedMessageId: 401755914,
      },
      payload: ByteBuffer.fromHex("15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 30 02 20 17 83 30 2d 95 a4 a9 fb 0d ec b8 fd d6 56 4b 90 a9 57 68 14 59 ae ee 06 99 61 be a6 1d 7b 24 71 25 03 9d 89 35 04 25 01 e8 03 30 02 20 99 f8 13 dd 41 bd 08 1a 1c 63 e8 11 82 8f 06 62 59 4b ca 89 cd 9d 4e d2 6f 74 27 fd b2 a0 27 36 18 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer(),
};

describe("MessageCodec", () => {
    context("decode", () => {
        it("decodes a message", () => {
            const result = MessageCodec.decodePayload(MessageCodec.decodePacket(ENCODED));

            assert.deepEqual(result, DECODED);
        });
        
        it("decodes a message 2", () => {
            const result = MessageCodec.decodePayload(MessageCodec.decodePacket(ENCODED_2));

            assert.deepEqual(result, DECODED_2);
        });
    });

    context("encode", () => {
        it("encodes a message", () => {
            const result = MessageCodec.encodePacket(MessageCodec.encodePayload(DECODED));

            assert.deepEqual(result, ENCODED);
        });

        it("encodes a message 2", () => {
            const result = MessageCodec.encodePacket(MessageCodec.encodePayload(DECODED_2));

            assert.deepEqual(result, ENCODED_2);
        });
    });
});
