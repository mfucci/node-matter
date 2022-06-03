import assert from "assert";
import { TlvType, TlvCodec } from "../../src/codec/TlvCodec";
import { TlvTag } from "../../src/codec/TlvTag";

const { Structure, ByteString, UnsignedInt, Boolean, List, Array } = TlvType;

const ENCODED = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca250233dc240300280435052501881325022c011818", "hex");
const ENCODED_2 = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca3002201783302d95a4a9fb0decb8fdd6564b90a957681459aeee069961bea61d7b247125039d8935042501e80330022099f813dd41bd081a1c63e811828f0662594bca89cd9d4ed26f7427fdb2a027361835052501881325022c011818", "hex");
const ENCODED_3 = Buffer.from("1536011535012600799ac60c37012402002403312404031824021418181535012600ddad82d6370124020024033024040118350224003c18181818290424ff0118", "hex");

const DECODED_ELEMENT = {
    tag: TlvTag.Anonymous,
    type: Structure,
    value: [
        {tag: TlvTag.contextual(1), type: ByteString, value: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex")},
        {tag: TlvTag.contextual(2), type: UnsignedInt, value: 56371},
        {tag: TlvTag.contextual(3), type: UnsignedInt, value: 0},
        {tag: TlvTag.contextual(4), type: Boolean, value: false},
        {tag: TlvTag.contextual(5), type: Structure, value: [
            {tag: TlvTag.contextual(1), type: UnsignedInt, value: 5000},
            {tag: TlvTag.contextual(2), type: UnsignedInt, value: 300}
        ]},
    ],
};

const DECODED_ELEMENT_2 = {
    tag: TlvTag.Anonymous,
    type: Structure,
    value: [
        {tag: TlvTag.contextual(1), type: ByteString, value: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex")},
        {tag: TlvTag.contextual(2), type: ByteString, value: Buffer.from("1783302d95a4a9fb0decb8fdd6564b90a957681459aeee069961bea61d7b2471", "hex")},
        {tag: TlvTag.contextual(3), type: UnsignedInt, value: 35229},
        {tag: TlvTag.contextual(4), type: Structure, value: [
            {tag: TlvTag.contextual(1), type: UnsignedInt, value: 1000},
            {tag: TlvTag.contextual(2), type: ByteString, value: Buffer.from("99f813dd41bd081a1c63e811828f0662594bca89cd9d4ed26f7427fdb2a02736", "hex")}
        ]},
        {tag: TlvTag.contextual(5), type: Structure, value: [
            {tag: TlvTag.contextual(1), type: UnsignedInt, value: 5000},
            {tag: TlvTag.contextual(2), type: UnsignedInt, value: 300},
        ]},
    ],
};

const DECODED_ELEMENT_3 = {
    tag: TlvTag.Anonymous,
    type: Structure,
    value: [
        {tag: TlvTag.contextual(1), type: Array, value: [
            {tag: TlvTag.Anonymous, type: Structure, value: [
                {tag: TlvTag.contextual(1), type: Structure, value: [
                    {tag: TlvTag.contextual(0), type: UnsignedInt, value: 0x0cc69a79},
                    {tag: TlvTag.contextual(1), type: List, value: [
                        {tag: TlvTag.contextual(2), type: UnsignedInt, value: 0},
                        {tag: TlvTag.contextual(3), type: UnsignedInt, value: 0x31},
                        {tag: TlvTag.contextual(4), type: UnsignedInt, value: 0x03},
                    ]},
                    {tag: TlvTag.contextual(2), type: UnsignedInt, value: 0x14},
                ]}
            ]},
            {tag: TlvTag.Anonymous, type: Structure, value: [
                {tag: TlvTag.contextual(1), type: Structure, value: [
                    {tag: TlvTag.contextual(0), type: UnsignedInt, value: 0xd682addd},
                    {tag: TlvTag.contextual(1), type: List, value: [
                        {tag: TlvTag.contextual(2), type: UnsignedInt, value: 0},
                        {tag: TlvTag.contextual(3), type: UnsignedInt, value: 0x30},
                        {tag: TlvTag.contextual(4), type: UnsignedInt, value: 0x01},
                    ]},
                    {tag: TlvTag.contextual(2), type: Structure, value: [
                        {tag: TlvTag.contextual(0), type: UnsignedInt, value: 0x3c},
                    ]},
                ]}
            ]},
        ]},
        {tag: TlvTag.contextual(4), type: Boolean, value: true},
        {tag: TlvTag.contextual(0xFF), type: UnsignedInt, value: 1},
    ],
};

describe("TlvCodec", () => {
    context("decodeElement", () => {
        it("decodes an element", () => {
            const element = TlvCodec.decodeElement(ENCODED);

            assert.deepEqual(element, DECODED_ELEMENT);
        });

        it("decodes an element 2", () => {
            const element = TlvCodec.decodeElement(ENCODED_2);

            assert.deepEqual(element, DECODED_ELEMENT_2);
        });

        it("decodes an element 3", () => {
            const element = TlvCodec.decodeElement(ENCODED_3);

            assert.deepEqual(element, DECODED_ELEMENT_3);
        });
    });

    context("encodeElement", () => {
        it("encodes an element", () => {
            const result = TlvCodec.encodeElement(DECODED_ELEMENT);

            assert.deepEqual(result, ENCODED);
        });

        it("encodes an element 2", () => {
            const result = TlvCodec.encodeElement(DECODED_ELEMENT_2);

            assert.deepEqual(result, ENCODED_2);
        });

        it("encodes an element 3", () => {
            const result = TlvCodec.encodeElement(DECODED_ELEMENT_3);

            assert.deepEqual(result, ENCODED_3);
        });
    });
});
