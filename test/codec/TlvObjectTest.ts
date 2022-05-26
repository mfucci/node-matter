import assert from "assert";
import { PrimitiveType } from "../../src/codec/TlvCodec";
import { MrpParameters, PbkdfParamRequest } from "../../src/commission/PaseMessages";
import { Field, ObjectTemplate, OptionalField, TlvObjectCodec } from "../../src/codec/TlvObjectCodec";
import { ReadResponseTemplate } from "../../src/interaction/InteractionMessages";
import { Tag } from "../../src/models/Tag";

const { ByteString, UnsignedInt, Boolean } = PrimitiveType;

const ENCODED = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca250233dc240300280435052501881325022c011818", "hex");
const ENCODED_NO_OPTIONALS = Buffer.from("153001204715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca250233dc280418", "hex");
const ENCODED_ARRAY_VARIABLE = Buffer.from("1536011535012600799ac60c37012402002403312404031824021418181535012600ddad82d6370124020024033024040118350224003c18181818290424ff0118", "hex");

const DECODED = {
    initiatorRandom: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex"),
    initiatorSessionId: 56371,
    passcodeId: 0,
    hasPbkdfParameters: false,
    mrpParameters: { idleRetransTimeout: 5000, activeRetransTimeout: 300 },
};

const DECODED_NO_OPTIONALS = {
    initiatorRandom: Buffer.from("4715a406c6b0496ad52039e347db8528cb69a1cb2fce6f2318552ae65e103aca", "hex"),
    initiatorSessionId: 56371,
    hasPbkdfParameters: false,
};

const DECODED_ARRAY_VARIABLE = {
    values: [
        { value: {
            version: 0x0cc69a79,
            path: {
                endpoint: 0,
                cluster: 0x31,
                attribute: 0x03,
            },
            value: { tag: Tag.Anonymous, type: PrimitiveType.UnsignedInt, value: 0x14},
        }},
        { value: {
            version: 0xd682addd,
            path: {
                endpoint: 0,
                cluster: 0x30,
                attribute: 0x01,
            },
            value: { tag: Tag.Anonymous, type: PrimitiveType.Structure, value: [
                {tag: Tag.contextual(0), type: UnsignedInt, value: 0x3c},
            ]},
        }},
    ],
    isFabricFiltered: true,
    interactionModelRevision: 1,
};

const TEST_TEMPLATE = ObjectTemplate<PbkdfParamRequest>({
    initiatorRandom: Field(1, ByteString),
    initiatorSessionId: Field(2, UnsignedInt),
    passcodeId: OptionalField(3, UnsignedInt),
    hasPbkdfParameters: Field(4, Boolean),
    mrpParameters: OptionalField(5, ObjectTemplate<MrpParameters>({
        idleRetransTimeout: OptionalField(1, UnsignedInt),
        activeRetransTimeout: OptionalField(2, UnsignedInt),
    })),
});

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
            const result = TlvObjectCodec.decode(ENCODED_ARRAY_VARIABLE, ReadResponseTemplate);

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
            const result = TlvObjectCodec.encode(DECODED_ARRAY_VARIABLE, ReadResponseTemplate);

            assert.deepEqual(result.toString("hex"), ENCODED_ARRAY_VARIABLE.toString("hex"));
        });
    });
});
