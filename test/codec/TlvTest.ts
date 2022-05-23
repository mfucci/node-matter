import assert from "assert";
import ByteBuffer from "bytebuffer";
import { ElementType, Field, OptionalField, Structure, Tlv } from "../../src/codec/Tlv";
import { Tag } from "../../src/models/Tag";
import { PbkdfParamRequest } from "../../src/commission/PakeMessages";

const ENCODED = ByteBuffer.fromHex("15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 25 02 33 dc 24 03 00 28 04 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer();
const ENCODED_NO_OPTIONALS = ByteBuffer.fromHex("15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 25 02 33 dc 28 04 18".replace(/ /g, "")).toBuffer();
const ENCODED_2 = ByteBuffer.fromHex("15 30 01 20 47 15 a4 06 c6 b0 49 6a d5 20 39 e3 47 db 85 28 cb 69 a1 cb 2f ce 6f 23 18 55 2a e6 5e 10 3a ca 30 02 20 17 83 30 2d 95 a4 a9 fb 0d ec b8 fd d6 56 4b 90 a9 57 68 14 59 ae ee 06 99 61 be a6 1d 7b 24 71 25 03 9d 89 35 04 25 01 e8 03 30 02 20 99 f8 13 dd 41 bd 08 1a 1c 63 e8 11 82 8f 06 62 59 4b ca 89 cd 9d 4e d2 6f 74 27 fd b2 a0 27 36 18 35 05 25 01 88 13 25 02 2c 01 18 18".replace(/ /g, "")).toBuffer();

const DECODED_ELEMENT = {
    tag: Tag.Anonymous,
    type: ElementType.Structure,
    value: [
        {tag: Tag.contextual(1), type: ElementType.ByteString, value: Buffer.from([0x47, 0x15, 0xa4, 0x06, 0xc6, 0xb0, 0x49, 0x6a, 0xd5, 0x20, 0x39, 0xe3, 0x47, 0xdb, 0x85, 0x28, 0xcb, 0x69, 0xa1, 0xcb, 0x2f, 0xce, 0x6f, 0x23, 0x18, 0x55, 0x2a, 0xe6, 0x5e, 0x10, 0x3a, 0xca])},
        {tag: Tag.contextual(2), type: ElementType.UnsignedInt, value: 56371},
        {tag: Tag.contextual(3), type: ElementType.UnsignedInt, value: 0},
        {tag: Tag.contextual(4), type: ElementType.Boolean, value: false},
        {tag: Tag.contextual(5), type: ElementType.Structure, value: [
            {tag: Tag.contextual(1), type: ElementType.UnsignedInt, value: 5000},
            {tag: Tag.contextual(2), type: ElementType.UnsignedInt, value: 300}
        ]},
    ],
};

const DECODED_ELEMENT_2 = {
    tag: Tag.Anonymous,
    type: ElementType.Structure,
    value: [
        {tag: Tag.contextual(1), type: ElementType.ByteString, value: Buffer.from([0x47, 0x15, 0xa4, 0x06, 0xc6, 0xb0, 0x49, 0x6a, 0xd5, 0x20, 0x39, 0xe3, 0x47, 0xdb, 0x85, 0x28, 0xcb, 0x69, 0xa1, 0xcb, 0x2f, 0xce, 0x6f, 0x23, 0x18, 0x55, 0x2a, 0xe6, 0x5e, 0x10, 0x3a, 0xca])},
        {tag: Tag.contextual(2), type: ElementType.ByteString, value: Buffer.from([0x17, 0x83, 0x30, 0x2d, 0x95, 0xa4, 0xa9, 0xfb, 0x0d, 0xec, 0xb8, 0xfd, 0xd6, 0x56, 0x4b, 0x90, 0xa9, 0x57, 0x68, 0x14, 0x59, 0xae, 0xee, 0x06, 0x99, 0x61, 0xbe, 0xa6, 0x1d, 0x7b, 0x24, 0x71])},
        {tag: Tag.contextual(3), type: ElementType.UnsignedInt, value: 35229},
        {tag: Tag.contextual(4), type: ElementType.Structure, value: [
            {tag: Tag.contextual(1), type: ElementType.UnsignedInt, value: 1000},
            {tag: Tag.contextual(2), type: ElementType.ByteString, value: Buffer.from([0x99, 0xf8, 0x13, 0xdd, 0x41, 0xbd, 0x08, 0x1a, 0x1c, 0x63, 0xe8, 0x11, 0x82, 0x8f, 0x06, 0x62, 0x59, 0x4b, 0xca, 0x89, 0xcd, 0x9d, 0x4e, 0xd2, 0x6f, 0x74, 0x27, 0xfd, 0xb2, 0xa0, 0x27, 0x36])}
        ]},
        {tag: Tag.contextual(5), type: ElementType.Structure, value: [
            {tag: Tag.contextual(1), type: ElementType.UnsignedInt, value: 5000},
            {tag: Tag.contextual(2), type: ElementType.UnsignedInt, value: 300}
        ]},
    ],
};

const DECODED = {
    initiatorRandom: Buffer.from([0x47, 0x15, 0xa4, 0x06, 0xc6, 0xb0, 0x49, 0x6a, 0xd5, 0x20, 0x39, 0xe3, 0x47, 0xdb, 0x85, 0x28, 0xcb, 0x69, 0xa1, 0xcb, 0x2f, 0xce, 0x6f, 0x23, 0x18, 0x55, 0x2a, 0xe6, 0x5e, 0x10, 0x3a, 0xca]),
    initiatorSessionId: 56371,
    passcodeId: 0,
    hasPbkdfParameters: false,
    mrpParameters: { idleRetransTimeout: 5000, activeRetransTimeout: 300 },
};

const DECODED_NO_OPTIONALS = {
    initiatorRandom: Buffer.from([0x47, 0x15, 0xa4, 0x06, 0xc6, 0xb0, 0x49, 0x6a, 0xd5, 0x20, 0x39, 0xe3, 0x47, 0xdb, 0x85, 0x28, 0xcb, 0x69, 0xa1, 0xcb, 0x2f, 0xce, 0x6f, 0x23, 0x18, 0x55, 0x2a, 0xe6, 0x5e, 0x10, 0x3a, 0xca]),
    initiatorSessionId: 56371,
    hasPbkdfParameters: false,
};

const { ByteString, UnsignedInt, Boolean } = ElementType;

const model = Structure<PbkdfParamRequest>(Tag.Anonymous, {
    initiatorRandom: Field(1, ByteString),
    initiatorSessionId: Field(2, UnsignedInt),
    passcodeId: OptionalField(3, UnsignedInt),
    hasPbkdfParameters: Field(4, Boolean),
    mrpParameters: OptionalField(5, {
        idleRetransTimeout: OptionalField(1, UnsignedInt),
        activeRetransTimeout: OptionalField(2, UnsignedInt),
    }),
});

describe("TlvReader", () => {
    const tlv = new Tlv();

    context("decodeElement", () => {
        it("decodes an element", () => {
            const element = tlv.decodeElement(ENCODED);

            assert.deepEqual(element, DECODED_ELEMENT);
        });

        it("decodes an element 2", () => {
            const element = tlv.decodeElement(ENCODED_2);

            assert.deepEqual(element, DECODED_ELEMENT_2);
        });
    });

    context("decode", () => {
        it("decodes a structure", () => {
            const result = tlv.decode(ENCODED, model);

            assert.deepEqual(result, DECODED);
        });

        it("decodes a structure with optionals", () => {
            const result = tlv.decode(ENCODED_NO_OPTIONALS, model);

            assert.deepEqual(result, DECODED_NO_OPTIONALS);
        });
    });

    context("encodeElement", () => {
        it("encodes an element", () => {
            const result = tlv.encodeElement(DECODED_ELEMENT);

            assert.deepEqual(result, ENCODED);
        });

        it("encodes an element 2", () => {
            const result = tlv.encodeElement(DECODED_ELEMENT_2);

            assert.deepEqual(result, ENCODED_2);
        });
    });

    context("encode", () => {
        it("encodes a structure", () => {
            const result = tlv.encode(DECODED, model);

            assert.deepEqual(result, ENCODED);
        });

        it("encodes a structure with optionals", () => {
            const result = tlv.encode(DECODED_NO_OPTIONALS, model);

            assert.deepEqual(result, ENCODED_NO_OPTIONALS);
        });
    });
});
