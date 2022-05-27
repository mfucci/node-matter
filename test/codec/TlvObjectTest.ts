import assert from "assert";
import { TlvType } from "../../src/codec/TlvCodec";
import { BooleanT, ByteStringT, JsType, ObjectT, Field, TlvObjectCodec, UnsignedIntT, OptionalField } from "../../src/codec/TlvObjectCodec";
import { ReadResponseT } from "../../src/interaction/InteractionMessages";
import { Tag } from "../../src/models/Tag";


const TEST_TEMPLATE = ObjectT({
    initiatorRandom: Field(1, ByteStringT),
    initiatorSessionId: Field(2, UnsignedIntT),
    passcodeId: OptionalField(3, UnsignedIntT),
    hasPbkdfParameters: Field(4, BooleanT),
    mrpParameters: OptionalField(5, ObjectT({
        idleRetransTimeout: OptionalField(1, UnsignedIntT),
        activeRetransTimeout: OptionalField(2, UnsignedIntT),
    })),
});

const ENCODED = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca250233dc240300280435052501881325022c011818", "hex");
const ENCODED_NO_OPTIONALS = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca250233dc280418", "hex");
const ENCODED_ARRAY_VARIABLE = Buffer.from("1536011535012600799ac60c37012402002403312404031824021418181535012600ddad82d6370124020024033024040118350224003c18181818290424ff0118", "hex");

const DECODED: JsType<typeof TEST_TEMPLATE> = {
    initiatorRandom: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex"),
    initiatorSessionId: 56371,
    passcodeId: 0,
    hasPbkdfParameters: false,
    mrpParameters: { idleRetransTimeout: 5000, activeRetransTimeout: 300 },
};

const DECODED_NO_OPTIONALS: JsType<typeof TEST_TEMPLATE> = {
    initiatorRandom: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex"),
    initiatorSessionId: 56371,
    hasPbkdfParameters: false,
};

const DECODED_ARRAY_VARIABLE = {
    values: [
        { value: {
            version: 0x0cc69a79,
            path: {
                endpointId: 0,
                clusterId: 0x31,
                attributeId: 0x03,
            },
            value: { tag: Tag.Anonymous, type: TlvType.UnsignedInt, value: 0x14},
        }},
        { value: {
            version: 0xd682addd,
            path: {
                endpointId: 0,
                clusterId: 0x30,
                attributeId: 0x01,
            },
            value: { tag: Tag.Anonymous, type: TlvType.Structure, value: [
                {tag: Tag.contextual(0), type: TlvType.UnsignedInt, value: 0x3c},
            ]},
        }},
    ],
    isFabricFiltered: true,
    interactionModelRevision: 1,
};

describe("TlvObjectCodec", () => {
    context("decode", () => {
        it("decodes a structure", () => {
            const result = TlvObjectCodec.decode(ENCODED, TEST_TEMPLATE);

            assert.deepEqual(result, DECODED);
        });

        it("decodes a structure with optionals", () => {
            const result = TlvObjectCodec.decode(ENCODED_NO_OPTIONALS, TEST_TEMPLATE);

            assert.deepEqual(result, DECODED_NO_OPTIONALS);
        });

        it("decodes a structure with lists and variable types", () => {
            const result = TlvObjectCodec.decode(ENCODED_ARRAY_VARIABLE, ReadResponseT);

            assert.deepEqual(result, DECODED_ARRAY_VARIABLE);
        });
    });

    context("encode", () => {
        it("encodes a structure", () => {
            const result = TlvObjectCodec.encode(DECODED, TEST_TEMPLATE);

            assert.deepEqual(result.toString("hex"), ENCODED.toString("hex"));
        });

        it("encodes a structure with optionals", () => {
            const result = TlvObjectCodec.encode(DECODED_NO_OPTIONALS, TEST_TEMPLATE);

            assert.deepEqual(result.toString("hex"), ENCODED_NO_OPTIONALS.toString("hex"));
        });

        it("encodes a structure with lists and variable types", () => {
            const result = TlvObjectCodec.encode(DECODED_ARRAY_VARIABLE, ReadResponseT);

            assert.deepEqual(result.toString("hex"), ENCODED_ARRAY_VARIABLE.toString("hex"));
        });
    });
});
