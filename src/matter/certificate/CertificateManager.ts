/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthorityKeyIdentifier_X509, BasicConstraints_X509, BitByteArray, BYTES_KEY, ContextTagged, DerCodec, DerObject, EcdsaWithSHA256_X962, ELEMENTS_KEY, ExtendedKeyUsage_X509, KeyUsage_Signature_ContentCommited_X509, KeyUsage_Signature_X509, OBJECT_ID_KEY, OrganisationName_X520, PublicKeyEcPrime256v1_X962, SubjectKeyIdentifier_X509 } from "../../codec/DerCodec";
import { Crypto, KeyPair } from "../../crypto/Crypto";
import { NodeId, TlvNodeId } from "../common/NodeId";
import { ByteArray, TlvArray, TlvBoolean, TlvByteString, TlvField, TlvList, TlvObject, TlvOptionalField, TlvUInt16, TlvUInt32, TlvUInt64, TlvUInt8, TypeFromSchema } from "@project-chip/matter.js";

const YEAR_S = 365 * 24 * 60 * 60;
const EPOCH_OFFSET_S = 10957 * 24 * 60 * 60;
export function matterToJsDate(date: number) {
    return new Date((date + EPOCH_OFFSET_S) * 1000);
}
export function jsToMatterDate(date: Date, addYears: number = 0) {
    return Math.floor(date.getTime() / 1000) - EPOCH_OFFSET_S + addYears * YEAR_S;
}

function intTo16Chars(value: bigint | number) {
    const byteArray = new ByteArray(8);
    const dataView = byteArray.getDataView();
    dataView.setBigUint64(0, typeof value === "bigint" ? value : BigInt(value));
    return byteArray.toHex().toUpperCase();
}

export const FabricId_Matter = (id: bigint | number) => [ DerObject("2b0601040182a27c0105", {value: intTo16Chars(id)}) ];
export const NodeId_Matter = (nodeId: NodeId) => [ DerObject("2b0601040182a27c0101", {value: intTo16Chars(nodeId.id)}) ];
export const RcacId_Matter = (id: bigint | number) => [ DerObject("2b0601040182a27c0104", {value: intTo16Chars(id)}) ];

export const TlvRootCertificate = TlvObject({
    serialNumber: TlvField(1, TlvByteString.bound({ maxLength: 20 })),
    signatureAlgorithm: TlvField(2, TlvUInt8),
    issuer: TlvField(3, TlvList({
        issuerRcacId: TlvOptionalField(20, TlvUInt64),
    })),
    notBefore: TlvField(4, TlvUInt32),
    notAfter: TlvField(5, TlvUInt32),
    subject: TlvField(6, TlvList({
        rcacId: TlvField(20, TlvUInt64),
    })),
    publicKeyAlgorithm: TlvField(7, TlvUInt8),
    ellipticCurveIdentifier: TlvField(8, TlvUInt8),
    ellipticCurvePublicKey: TlvField(9, TlvByteString),
    extensions: TlvField(10, TlvList({
        basicConstraints: TlvField(1,  TlvObject({
            isCa: TlvField(1, TlvBoolean),
            pathLen: TlvOptionalField(2, TlvUInt8),
        })),
        keyUsage: TlvField(2, TlvUInt16),
        extendedKeyUsage: TlvOptionalField(3, TlvArray(TlvUInt8)),
        subjectKeyIdentifier: TlvField(4, TlvByteString.bound({ length: 20 })),
        authorityKeyIdentifier: TlvField(5, TlvByteString.bound({ length: 20 })),
        futureExtension: TlvOptionalField(6, TlvByteString),
    })),
    signature: TlvField(11, TlvByteString),
});

export const TlvOperationalCertificate = TlvObject({
    serialNumber: TlvField(1, TlvByteString.bound({ maxLength: 20 })),
    signatureAlgorithm: TlvField(2, TlvUInt8),
    issuer: TlvField(3, TlvList({
        issuerRcacId: TlvOptionalField(20, TlvUInt64),
    })),
    notBefore: TlvField(4, TlvUInt32),
    notAfter: TlvField(5, TlvUInt32),
    subject: TlvField(6, TlvList({
        fabricId: TlvField(21, TlvUInt64),
        nodeId: TlvField(17, TlvNodeId),
    })),
    publicKeyAlgorithm: TlvField(7, TlvUInt8),
    ellipticCurveIdentifier: TlvField(8, TlvUInt8),
    ellipticCurvePublicKey: TlvField(9, TlvByteString),
    extensions: TlvField(10, TlvList({
        basicConstraints: TlvField(1,  TlvObject({
            isCa: TlvField(1,  TlvBoolean),
            pathLen: TlvOptionalField(2, TlvUInt8),
        })),
        keyUsage: TlvField(2, TlvUInt16),
        extendedKeyUsage: TlvOptionalField(3, TlvArray(TlvUInt8)),
        subjectKeyIdentifier: TlvField(4, TlvByteString.bound({ length: 20 })),
        authorityKeyIdentifier: TlvField(5, TlvByteString.bound({ length: 20 })),
        futureExtension: TlvOptionalField(6, TlvByteString),
    })),
    signature: TlvField(11, TlvByteString),
});

export type RootCertificate = TypeFromSchema<typeof TlvRootCertificate>;
export type OperationalCertificate = TypeFromSchema<typeof TlvOperationalCertificate>;
type Unsigned<Type> = { [Property in keyof Type as Exclude<Property, "signature">]: Type[Property] };

export class CertificateManager {
    static rootCertToAsn1({ serialNumber, notBefore, notAfter, issuer: { issuerRcacId }, subject: { rcacId }, ellipticCurvePublicKey, extensions: { subjectKeyIdentifier, authorityKeyIdentifier } }: Unsigned<RootCertificate>) {
        return DerCodec.encode({
            version: ContextTagged(0, 2),
            serialNumber: serialNumber[0],
            signatureAlgorithm: EcdsaWithSHA256_X962,
            issuer: {
                issuerRcacId: issuerRcacId === undefined ? undefined : RcacId_Matter(issuerRcacId),
            },
            validity: {
                notBefore: matterToJsDate(notBefore),
                notAfter: matterToJsDate(notAfter),
            },
            subject: {
                rcacId: RcacId_Matter(rcacId),
            },
            publicKey: PublicKeyEcPrime256v1_X962(ellipticCurvePublicKey),
            extensions: ContextTagged(3, {
                basicConstraints: BasicConstraints_X509({ isCa: true }),
                keyUsage: KeyUsage_Signature_ContentCommited_X509,
                subjectKeyIdentifier: SubjectKeyIdentifier_X509(subjectKeyIdentifier),
                authorityKeyIdentifier: AuthorityKeyIdentifier_X509(authorityKeyIdentifier),
            }),
        });
    }

    static nocCertToAsn1({ serialNumber, notBefore, notAfter, issuer: { issuerRcacId }, subject: { fabricId, nodeId }, ellipticCurvePublicKey, extensions: { subjectKeyIdentifier, authorityKeyIdentifier } }: Unsigned<OperationalCertificate>) {
        return DerCodec.encode({
            version: ContextTagged(0, 2),
            serialNumber: serialNumber[0],
            signatureAlgorithm: EcdsaWithSHA256_X962,
            issuer: {
                issuerRcacId: issuerRcacId === undefined ? undefined : RcacId_Matter(issuerRcacId),
            },
            validity: {
                notBefore: matterToJsDate(notBefore),
                notAfter: matterToJsDate(notAfter),
            },
            subject: {
                fabricId: FabricId_Matter(fabricId),
                nodeId: NodeId_Matter(nodeId),
            },
            publicKey: PublicKeyEcPrime256v1_X962(ellipticCurvePublicKey),
            extensions: ContextTagged(3, {
                basicConstraints: BasicConstraints_X509({}),
                keyUsage: KeyUsage_Signature_X509,
                extendedKeyUsage: ExtendedKeyUsage_X509({ serverAuth: true, clientAuth: true }),
                subjectKeyIdentifier: SubjectKeyIdentifier_X509(subjectKeyIdentifier),
                authorityKeyIdentifier: AuthorityKeyIdentifier_X509(authorityKeyIdentifier),
            }),
        });
    }

    static validateRootCertificate(rootCert: RootCertificate) {
        Crypto.verify(rootCert.ellipticCurvePublicKey, this.rootCertToAsn1(rootCert), rootCert.signature);
    }

    static validateNocCertificate(rootCert: RootCertificate, nocCert: OperationalCertificate) {
        Crypto.verify(rootCert.ellipticCurvePublicKey, this.nocCertToAsn1(nocCert), nocCert.signature);
    }

    static createCertificateSigningRequest(keys: KeyPair) {
        const request = {
            version: 0,
            subject: { organization: OrganisationName_X520("CSR") },
            publicKey: PublicKeyEcPrime256v1_X962(keys.publicKey),
            endSignedBytes: ContextTagged(0),
        };

        return DerCodec.encode({
            request,
            signAlgorithm: EcdsaWithSHA256_X962,
            signature: BitByteArray(Crypto.sign(keys.privateKey, DerCodec.encode(request), "der")),
        });
    }

    static getPublicKeyFromCsr(csr: ByteArray) {
        const { [ELEMENTS_KEY]: rootElements } = DerCodec.decode(csr);
        if (rootElements?.length !== 3) throw new Error("Invalid CSR data");
        const [ requestNode, signAlgorithmNode, signatureNode ] = rootElements;
        
        // Extract the public key
        const { [ELEMENTS_KEY]: requestElements } = requestNode;
        if (requestElements?.length !== 4) throw new Error("Invalid CSR data");
        const [ versionNode, subjectNode, publicKeyNode ] = requestElements;
        const requestVersion = versionNode[BYTES_KEY][0];
        if (requestVersion !== 0) throw new Error(`Unsupported request version${requestVersion}`);
        // TODO: verify subject = { OrganisationName: "CSR" }

        const { [ELEMENTS_KEY]: publicKeyElements } = publicKeyNode;
        if (publicKeyElements?.length !== 2) throw new Error("Invalid CSR data");
        const [ publicKeyTypeNode, publicKeyBytesNode ] = publicKeyElements;
        // TODO: verify publicKey algorithm
        const publicKey = publicKeyBytesNode[BYTES_KEY];

        // Verify the CSR signature
        if (!EcdsaWithSHA256_X962[OBJECT_ID_KEY][BYTES_KEY].equals(signAlgorithmNode[ELEMENTS_KEY]?.[0]?.[BYTES_KEY])) throw new Error("Unsupported signature type");
        Crypto.verify(publicKey, DerCodec.encode(requestNode), signatureNode[BYTES_KEY], "der");

        return publicKey;
    }
}
