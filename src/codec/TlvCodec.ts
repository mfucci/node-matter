import { Tag } from "../models/Tag";
import { LEBufferReader } from "../util/LEBufferReader";
import { LEBufferWriter } from "../util/LEBufferWriter";

const enum TagControl {
    Anonymous = 0x00,
    ContextSpecific = 0x20,
    CommonProfile2Bytes = 0x40,
    CommonProfile4Bytes = 0x60,
    ImplicitProfile2Bytes = 0x80,
    ImplicitProfile4Bytes = 0xA0,
    FullyQualified6Bytes = 0xC0,
    FullyQualified8Bytes = 0xE0,
}

export enum TlvType {
    SignedInt = 0x00,
    UnsignedInt = 0x04,
    Boolean = 0x08,
    Float = 0x0A,
    Double = 0x0B,
    String = 0x0C,
    ByteString = 0x10,
    Null = 0x14,
    Structure = 0x15,
    Array = 0x16,
    List = 0x17,
    EndOfContainer = 0x18,
}

export const enum ElementSize {
    Byte1 = 0x00,
    Byte2 = 0x01,
    Byte4 = 0x02,
    Byte8 = 0x03,
}

export interface Element {
    type: TlvType,
    value: any,
    tag: Tag,
}

export class TlvCodec {
    static decodeElement(data: Buffer): Element {
        return this.decodeElementInternal(new LEBufferReader(data));
    }

    private static decodeElementInternal(reader: LEBufferReader): Element {
        const { tag, typeSizeByte } = this.decodeTagAndTypeSize(reader);
        const {value, type} = this.decodeValue(reader, typeSizeByte);
        return {tag, type, value};
    }

    private static decodeTagAndTypeSize(reader: LEBufferReader) {
        const controlByte = reader.readUInt8();
        const tag = this.decodeTag(reader, (controlByte & 0xE0) as TagControl);
        return {tag, typeSizeByte: controlByte & 0x1F};
    }

    private static decodeTag(reader: LEBufferReader, tagControl: TagControl): Tag {
        switch (tagControl) {
            case TagControl.Anonymous:
                return Tag.Anonymous;
            case TagControl.ContextSpecific:
                return Tag.contextual(reader.readUInt8());
            case TagControl.CommonProfile2Bytes:
                return Tag.contextual(reader.readUInt16());
            case TagControl.CommonProfile4Bytes:
                return Tag.contextual(reader.readUInt32());
            case TagControl.ImplicitProfile2Bytes:
                case TagControl.ImplicitProfile4Bytes:
                throw new Error(`Unsupported implicit profile ${tagControl}`);
            case TagControl.FullyQualified6Bytes:
                return new Tag(reader.readUInt32(), reader.readUInt16());
            case TagControl.FullyQualified6Bytes:
                return new Tag(reader.readUInt32(), reader.readUInt32());
            default:
                throw new Error(`Unexpected tagControl ${tagControl}`);
        }
    }

    private static decodeValue(reader: LEBufferReader, typeSizeByte: Number) {
        switch (typeSizeByte) {
            case TlvType.SignedInt + ElementSize.Byte1:
                return {value: reader.readInt8(), type: TlvType.SignedInt};
            case TlvType.SignedInt + ElementSize.Byte2:
                return {value: reader.readInt16(), type: TlvType.SignedInt};
            case TlvType.SignedInt + ElementSize.Byte4:
                return {value: reader.readInt32(), type: TlvType.SignedInt};
            case TlvType.SignedInt + ElementSize.Byte8:
                return {value: reader.readInt64(), type: TlvType.SignedInt};
            case TlvType.UnsignedInt + ElementSize.Byte1:
                return {value: reader.readUInt8(), type: TlvType.UnsignedInt};
            case TlvType.UnsignedInt + ElementSize.Byte2:
                return {value: reader.readUInt16(), type: TlvType.UnsignedInt};
            case TlvType.UnsignedInt + ElementSize.Byte4:
                return {value: reader.readUInt32(), type: TlvType.UnsignedInt};
            case TlvType.UnsignedInt + ElementSize.Byte8:
                return {value: reader.readUInt64(), type: TlvType.UnsignedInt};
            case TlvType.Boolean:
                return {value: false, type: TlvType.Boolean};
            case TlvType.Boolean + 1:
                return {value: true, type: TlvType.Boolean};
            case TlvType.Float:
                return {value: reader.readFloat(), type: TlvType.Float};
            case TlvType.Double:
                return {value: reader.readDouble(), type: TlvType.Double};
            case TlvType.String + ElementSize.Byte1:
                return {value: reader.readString(reader.readUInt8()), type: TlvType.String};
            case TlvType.String + ElementSize.Byte2:
                return {value: reader.readString(reader.readUInt16()), type: TlvType.String};
            case TlvType.String + ElementSize.Byte4:
                return {value: reader.readString(reader.readUInt32()), type: TlvType.String};
            case TlvType.String + ElementSize.Byte8:
                return {value: reader.readString(Number(reader.readUInt64())), type: TlvType.String};
            case TlvType.ByteString + ElementSize.Byte1:
                return {value: reader.readBytes(reader.readUInt8()), type: TlvType.ByteString};
            case TlvType.ByteString + ElementSize.Byte2:
                return {value: reader.readBytes(reader.readUInt16()), type: TlvType.ByteString};
            case TlvType.ByteString + ElementSize.Byte4:
                return {value: reader.readBytes(reader.readUInt32()), type: TlvType.ByteString};
            case TlvType.ByteString + ElementSize.Byte8:
                return {value: reader.readBytes(Number(reader.readUInt64())), type: TlvType.ByteString};
            case TlvType.Null:
                return {value: null, type: TlvType.Null};
            case TlvType.Array:
                return {value: this.decodeContainer(reader), type: TlvType.Array};
            case TlvType.List:
                return {value: this.decodeContainer(reader), type: TlvType.List};
            case TlvType.Structure:
                return {value: this.decodeContainer(reader), type: TlvType.Structure};
            case TlvType.EndOfContainer:
                return {value: undefined, type: TlvType.EndOfContainer};
            default:
                throw new Error(`Unexpected elementType 0x${typeSizeByte.toFixed(16)}`);
        }
    }

    private static decodeContainer(reader: LEBufferReader) {
        const result = new Array<Element>();
        while (true) {
            const element = this.decodeElementInternal(reader);
            if (element.type === TlvType.EndOfContainer) return result;
            // TODO: check type compatibility
            result.push(element);
        }
    }

    static encodeElement(element: Element | undefined) {
        const writer = new LEBufferWriter();
        this.encodeElementInternal(writer, element);
        return writer.toBuffer();
    }

    private static encodeElementInternal(writer: LEBufferWriter, element: Element | undefined) {
        if (element === undefined) return;
        switch (element.type) {
            case TlvType.ByteString:
                return this.encodeByteString(writer, element);
            case TlvType.String:
                return this.encodeString(writer, element);
            case TlvType.UnsignedInt:
                return this.encodeUnsignedInt(writer, element);
            case TlvType.SignedInt:
                return this.encodeSignedInt(writer, element);
            case TlvType.Boolean:
                return this.encodeBoolean(writer, element);
            case TlvType.Structure:
                return this.encodeContainer(writer, element);
            case TlvType.Array:
                return this.encodeContainer(writer, element);
            case TlvType.List:
                return this.encodeContainer(writer, element);
            default:
                throw new Error(`Unsupported element type: ${element.type}`);
        }
    }

    private static encodeString(writer: LEBufferWriter, {value, tag}: Element) {
        const length = value.length;
        const size = this.getUnsignedIntSize(length); 
        this.encodeControlByteAndTag(writer, TlvType.String | size, tag);
        this.encodeUnsignedIntBytes(writer, length, size);
        writer.writeString(value);
    }

    private static encodeByteString(writer: LEBufferWriter, {value, tag}: Element) {
        const length = value.length;
        const size = this.getUnsignedIntSize(length);
        this.encodeControlByteAndTag(writer, TlvType.ByteString | size, tag);
        this.encodeUnsignedIntBytes(writer, length, size);
        writer.writeBytes(value);
    }

    private static encodeUnsignedInt(writer: LEBufferWriter, {value, tag}: Element) {
        const size = this.getUnsignedIntSize(value);
        this.encodeControlByteAndTag(writer, TlvType.UnsignedInt | size, tag);
        this.encodeUnsignedIntBytes(writer, value, size);
    }

    private static encodeSignedInt(writer: LEBufferWriter, {value, tag}: Element) {
        const size = this.getSignedIntSize(value);
        this.encodeControlByteAndTag(writer, TlvType.UnsignedInt | size, tag);
        this.encodeSignedIntBytes(writer, value, size);
    }

    private static encodeBoolean(writer: LEBufferWriter, {value, tag}: Element) {
        this.encodeControlByteAndTag(writer, TlvType.Boolean | (value ? 1 : 0), tag);
    }

    private static encodeContainer(writer: LEBufferWriter, {type, value, tag}: Element) {
        this.encodeControlByteAndTag(writer, type, tag);
        (value as Element[]).forEach(element => this.encodeElementInternal(writer, element));
        this.encodeControlByteAndTag(writer, TlvType.EndOfContainer, Tag.Anonymous);
    }

    private static encodeControlByteAndTag(writer: LEBufferWriter, valueType: TlvType, tag: Tag) {
        var tagControl;
        var longTag = (tag.id & 0xFFFF0000) !== 0;
        if (tag.isAnonymous()) {
            tagControl = TagControl.Anonymous;
        } else if (tag.isContextual()) {
            tagControl = TagControl.ContextSpecific;
        } else if (tag.isCommon()) {
            tagControl = longTag ? TagControl.CommonProfile4Bytes : TagControl.CommonProfile2Bytes;
        } else {
            tagControl = longTag ? TagControl.FullyQualified8Bytes : TagControl.FullyQualified6Bytes;
        }
        writer.writeUInt8(tagControl | valueType);
        switch (tagControl) {
            case TagControl.ContextSpecific:
                writer.writeUInt8(tag.id);
                break;
            case TagControl.CommonProfile2Bytes:
                writer.writeUInt16(tag.id);
                break;
            case TagControl.CommonProfile4Bytes:
                writer.writeUInt32(tag.id);
                break;
            case TagControl.FullyQualified6Bytes:
                writer.writeUInt32(tag.profile);
                writer.writeUInt16(tag.id);
                break;
            case TagControl.FullyQualified8Bytes:
                writer.writeUInt32(tag.profile);
                writer.writeUInt32(tag.id);
                break;
            case TagControl.Anonymous:
                // No need to write the tag
                break;
        }
    }

    private static encodeUnsignedIntBytes(writer: LEBufferWriter, value: number | bigint, size: ElementSize) {
        if (typeof value === "number") {
            switch (size) {
                case ElementSize.Byte1:
                    writer.writeUInt8(value);
                    break;
                case ElementSize.Byte2:
                    writer.writeUInt16(value);
                    break;
                case ElementSize.Byte4:
                    writer.writeUInt32(value);
                    break;
                case ElementSize.Byte8:
                    throw new Error("64 bits number should be stored on a bigint");
            }
        } else {
            switch (size) {
                case ElementSize.Byte1:
                    writer.writeUInt8(Number(value));
                    break;
                case ElementSize.Byte2:
                    writer.writeUInt16(Number(value));
                    break;
                case ElementSize.Byte4:
                    writer.writeUInt32(Number(value));
                    break;
                case ElementSize.Byte8:
                    writer.writeUInt64(value);
                    break;
            }
        }
    }

    private static encodeSignedIntBytes(writer: LEBufferWriter, value: number | bigint, size: ElementSize) {
        if (typeof value === "number") {
            switch (size) {
                case ElementSize.Byte1:
                    writer.writeInt8(value);
                    break;
                case ElementSize.Byte2:
                    writer.writeInt16(value);
                    break;
                case ElementSize.Byte4:
                    writer.writeInt32(value);
                    break;
                case ElementSize.Byte8:
                    throw new Error("64 bits number should be stored on a bigint");
            }
        } else {
            switch (size) {
                case ElementSize.Byte1:
                    writer.writeInt8(Number(value));
                    break;
                case ElementSize.Byte2:
                    writer.writeInt16(Number(value));
                    break;
                case ElementSize.Byte4:
                    writer.writeInt32(Number(value));
                    break;
                case ElementSize.Byte8:
                    writer.writeInt64(value);
                    break;
            }
        }
    }

    private static getUnsignedIntSize(value: number | bigint) {
        if (value < 256) {
            return ElementSize.Byte1;
        } else if (value < 65536) {
            return ElementSize.Byte2;
        } else if (value < 4294967296) {
            return ElementSize.Byte4;
        } else {
            return ElementSize.Byte8;
        }
    }

    private static getSignedIntSize(value: number | bigint) {
        if (value < 128 && value >= -128) {
            return ElementSize.Byte1;
        } else if (value < 32767 && value >= -32768) {
            return ElementSize.Byte2;
        } else if (value < 2147483647 && value >= -2147483648) {
            return ElementSize.Byte4;
        } else {
            return ElementSize.Byte8;
        }
    }
}
