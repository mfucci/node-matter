import { Tag } from "../models/Tag";
import { LEBufferReader } from "../util/LEBufferReader";
import { LEBufferWriter } from "../util/LEBufferWriter";

export type ObjectMap<T> = {[key in keyof T]: StructureDescription<any>};
export interface StructureDescription<T> {
    type: ElementType | ObjectMap<any>,
    tag: Tag,
    optional: boolean,
}

export const OptionalField = (id: number, type: ElementType | ObjectMap<any>):StructureDescription<any> => ({ type, tag: Tag.contextual(id), optional: true });
export const Field = (id: number, type: ElementType | ObjectMap<any>) => ({ type, tag: Tag.contextual(id), optional: false });
export const Structure = <T,>(tag: Tag, map: ObjectMap<T>):StructureDescription<T> => ({ type: map, tag, optional: false });

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

export enum ElementType {
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
    UInt8 = 0x04,
}

interface Element {
    type: ElementType,
    value: any,
    tag: Tag,
}

export class Tlv {
    decode<T>(data: Buffer, structure: StructureDescription<T>): T {
        return this.decodeField(this.decodeElement(data), structure) as T;
    }

    private decodeField(element: Element | undefined, structure: StructureDescription<any>): any {
        const {type, optional, tag: expectedTag} = structure;
        if (element === undefined) {
            if (!optional) throw new Error("Missing mandatory field");
            return undefined;
        }
        const {tag, value} = element;
        if (!tag.equals(expectedTag)) throw new Error(`Unexpected tag ${tag}. Expected was ${expectedTag}`);

        switch (type) {
            case ElementType.Boolean:
            case ElementType.ByteString:
            case ElementType.SignedInt:
            case ElementType.UnsignedInt:
                return value;
            default: // ObjectMap
                return this.decodeObject(value as Element[], type as ObjectMap<any>);
        }
    }

    private decodeObject(elements: Element[], objectMap: ObjectMap<any>) {
        const result: any = {};
        for (var key in objectMap) {
            const fieldDescription = objectMap[key];
            const element = elements.find(({tag}) => tag.equals(fieldDescription.tag));
            const value = this.decodeField(element, fieldDescription);
            if (value === undefined) continue;
            result[key] = value;
        }
        return result;
    }

    decodeElement(data: Buffer): Element {
        return this.decodeElementInternal(new LEBufferReader(data));
    }

    private decodeElementInternal(reader: LEBufferReader): Element {
        const controlByte = reader.readUInt8();
        const tag = this.decodeTag(reader, (controlByte & 0xE0) as TagControl);
        const {value, type} = this.decodeValue(reader, controlByte & 0x1F);
        return {tag, type, value};
    }

    private decodeTag(reader: LEBufferReader, tagControl: TagControl) {
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

    private decodeValue(reader: LEBufferReader, typeSizeByte: number) {
        switch (typeSizeByte) {
            case ElementType.SignedInt + ElementSize.Byte1:
                return {value: reader.readInt8(), type: ElementType.SignedInt};
            case ElementType.SignedInt + ElementSize.Byte2:
                return {value: reader.readInt16(), type: ElementType.SignedInt};
            case ElementType.SignedInt + ElementSize.Byte4:
                return {value: reader.readInt32(), type: ElementType.SignedInt};
            case ElementType.SignedInt + ElementSize.Byte8:
                return {value: reader.readInt64(), type: ElementType.SignedInt};
            case ElementType.UnsignedInt + ElementSize.Byte1:
                return {value: reader.readUInt8(), type: ElementType.UnsignedInt};
            case ElementType.UnsignedInt + ElementSize.Byte2:
                return {value: reader.readUInt16(), type: ElementType.UnsignedInt};
            case ElementType.UnsignedInt + ElementSize.Byte4:
                return {value: reader.readUInt32(), type: ElementType.UnsignedInt};
            case ElementType.UnsignedInt + ElementSize.Byte8:
                return {value: reader.readUInt64(), type: ElementType.UnsignedInt};
            case ElementType.Boolean:
                return {value: false, type: ElementType.Boolean};
            case ElementType.Boolean + 1:
                return {value: true, type: ElementType.Boolean};
            case ElementType.Float:
                return {value: reader.readFloat(), type: ElementType.Float};
            case ElementType.Double:
                return {value: reader.readDouble(), type: ElementType.Double};
            case ElementType.String + ElementSize.Byte1:
                return {value: reader.readString(reader.readUInt8()), type: ElementType.String};
            case ElementType.String + ElementSize.Byte2:
                return {value: reader.readString(reader.readUInt16()), type: ElementType.String};
            case ElementType.String + ElementSize.Byte4:
                return {value: reader.readString(reader.readUInt32()), type: ElementType.String};
            case ElementType.String + ElementSize.Byte8:
                return {value: reader.readString(Number(reader.readUInt64())), type: ElementType.String};
            case ElementType.ByteString + ElementSize.Byte1:
                return {value: reader.readBytes(reader.readUInt8()), type: ElementType.ByteString};
            case ElementType.ByteString + ElementSize.Byte2:
                return {value: reader.readBytes(reader.readUInt16()), type: ElementType.ByteString};
            case ElementType.ByteString + ElementSize.Byte4:
                return {value: reader.readBytes(reader.readUInt32()), type: ElementType.ByteString};
            case ElementType.ByteString + ElementSize.Byte8:
                return {value: reader.readBytes(Number(reader.readUInt64())), type: ElementType.ByteString};
            case ElementType.Null:
                return {value: null, type: ElementType.Null};
            case ElementType.Structure:
                return {value: this.decodeStructure(reader), type: ElementType.Structure};
            case ElementType.EndOfContainer:
                return {value: undefined, type: ElementType.EndOfContainer};
            default:
                throw new Error(`Unexpected elementType 0x${typeSizeByte.toFixed(16)}`);
        }
    }

    private decodeStructure(reader: LEBufferReader) {
        const result = new Array<Element>();
        while (true) {
            const element= this.decodeElementInternal(reader);
            if (element.type === ElementType.EndOfContainer) return result;
            result.push(element);
        }
    }

    encode<T>(value: T, structure: StructureDescription<T>) {
        return this.encodeElement(this.encodeField(value, structure));
    }

    private encodeField(value: any, structure: StructureDescription<any>): Element | undefined {
        const {type, optional, tag} = structure;
        if (value === undefined) {
            if (!optional) throw new Error("Missing mandatory field");
            return undefined;
        }

        switch (type) {
            case ElementType.Boolean:
            case ElementType.ByteString:
            case ElementType.SignedInt:
            case ElementType.UnsignedInt:
                return {tag, type, value};
            default: // StructureMap
                return {tag, type: ElementType.Structure, value: this.encodeObject(value, type as ObjectMap<any>)};
        }
    }

    private encodeObject(structure: any, objectMap: ObjectMap<any>) {
        const result = new Array<Element>();
        for (var key in objectMap) {
            const element = this.encodeField(structure[key], objectMap[key]);
            if (element === undefined) continue;
            result.push(element);
        }
        return result;
    }

    encodeElement(element: Element | undefined) {
        const writer = new LEBufferWriter();
        this.encodeElementInternal(writer, element);
        return writer.toBuffer();
    }

    private encodeElementInternal(writer: LEBufferWriter, element: Element | undefined) {
        if (element === undefined) return;
        switch (element.type) {
            case ElementType.ByteString:
                return this.encodeByteString(writer, element);
            case ElementType.String:
                return this.encodeString(writer, element);
            case ElementType.UnsignedInt:
                return this.encodeUnsignedInt(writer, element);
            case ElementType.SignedInt:
                return this.encodeSignedInt(writer, element);
            case ElementType.Boolean:
                return this.encodeBoolean(writer, element);
            case ElementType.Structure:
                return this.encodeStructure(writer, element);
            default:
                throw new Error(`Unsupported element type: ${element.type}`);
        }
    }

    private encodeString(writer: LEBufferWriter, {value, tag}: Element) {
        const length = value.length;
        const size = this.getUnsignedIntSize(length); 
        this.encodeControlByteAndTag(writer, ElementType.String | size, tag);
        this.encodeUnsignedIntBytes(writer, length, size);
        writer.writeString(value);
    }

    private encodeByteString(writer: LEBufferWriter, {value, tag}: Element) {
        const length = value.length;
        const size = this.getUnsignedIntSize(length);
        this.encodeControlByteAndTag(writer, ElementType.ByteString | size, tag);
        this.encodeUnsignedIntBytes(writer, length, size);
        writer.writeBytes(value);
    }

    private encodeUnsignedInt(writer: LEBufferWriter, {value, tag}: Element) {
        const size = this.getUnsignedIntSize(value);
        this.encodeControlByteAndTag(writer, ElementType.UnsignedInt | size, tag);
        this.encodeUnsignedIntBytes(writer, value, size);
    }

    private encodeSignedInt(writer: LEBufferWriter, {value, tag}: Element) {
        const size = this.getSignedIntSize(value);
        this.encodeControlByteAndTag(writer, ElementType.UnsignedInt | size, tag);
        this.encodeSignedIntBytes(writer, value, size);
    }

    private encodeBoolean(writer: LEBufferWriter, {value, tag}: Element) {
        this.encodeControlByteAndTag(writer, ElementType.Boolean | (value ? 1 : 0), tag);
    }

    private encodeStructure(writer: LEBufferWriter, {value, tag}: Element) {
        this.encodeControlByteAndTag(writer, ElementType.Structure, tag);
        for (var key in value) {
            this.encodeElementInternal(writer, value[key]);
        }
        this.encodeControlByteAndTag(writer, ElementType.EndOfContainer, Tag.Anonymous);
    }

    private encodeControlByteAndTag(writer: LEBufferWriter, valueType: ElementType, tag: Tag) {
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

    private encodeUnsignedIntBytes(writer: LEBufferWriter, value: number | bigint, size: ElementSize) {
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

    private encodeSignedIntBytes(writer: LEBufferWriter, value: number | bigint, size: ElementSize) {
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

    private getUnsignedIntSize(value: number | bigint) {
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

    private getSignedIntSize(value: number | bigint) {
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
