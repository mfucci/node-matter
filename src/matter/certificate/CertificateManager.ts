/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthorityKeyIdentifier_X509, BasicConstraints_X509, BitByteArray, BYTES_KEY, ContextTagged, DerCodec, DerObject, EcdsaWithSHA256_X962, ELEMENTS_KEY, ExtendedKeyUsage_X509, KeyUsage_Signature_ContentCommited_X509, KeyUsage_Signature_X509, OBJECT_ID_KEY, OrganisationName_X520, PublicKeyEcPrime256v1_X962, SubjectKeyIdentifier_X509 } from "../../codec/DerCodec";
import { Crypto, KeyPair } from "../../crypto/Crypto";
import { NodeId, TlvNodeId } from "../common/NodeId";
import { tlv, util } from "@project-chip/matter.js";

const YEAR_S = 365 * 24 * 60 * 60;
const EPOCH_OFFSET_S = 10957 * 24 * 60 * 60;
export function matterToJsDate(date: number) {
    return new Date((date + EPOCH_OFFSET_S) * 1000);
}
export function jsToMatterDate(date: Date, addYears: number = 0) {
    return Math.floor(date.getTime() / 1000) - EPOCH_OFFSET_S + addYears * YEAR_S;
}

function intTo16Chars(value: bigint | number) {
    const byteArray = new util.ByteArray(8);
    const dataView = byteArray.getDataView();
    dataView.setBigUint64(0, typeof value === "bigint" ? value : BigInt(value));
    return byteArray.toHex().toUpperCase();
}

export const FabricId_Matter = (id: bigint | number) => [ DerObject("2b0601040182a27c0105", {value: intTo16Chars(id)}) ];
export const NodeId_Matter = (nodeId: NodeId) => [ DerObject("2b0601040182a27c0101", {value: intTo16Chars(nodeId.id)}) ];
export const RcacId_Matter = (id: bigint | number) => [ DerObject("2b0601040182a27c0104", {value: intTo16Chars(id)}) ];

export const TlvRootCertificate = tlv.Object({
    serialNumber: tlv.Field(1, tlv.ByteString.bound({ maxLength: 20 })),
    signatureAlgorithm: tlv.Field(2, tlv.UInt8),
    issuer: tlv.Field(3, tlv.List({
        issuerRcacId: tlv.OptionalField(20, tlv.UInt64),
    })),
    notBefore: tlv.Field(4, tlv.UInt32),
    notAfter: tlv.Field(5, tlv.UInt32),
    subject: tlv.Field(6, tlv.List({
        rcacId: tlv.Field(20, tlv.UInt64),
    })),
    publicKeyAlgorithm: tlv.Field(7, tlv.UInt8),
    ellipticCurveIdentifier: tlv.Field(8, tlv.UInt8),
    ellipticCurvePublicKey: tlv.Field(9, tlv.ByteString),
    extensions: tlv.Field(10, tlv.List({
        basicConstraints: tlv.Field(1,  tlv.Object({
            isCa: tlv.Field(1,  tlv.Boolean),
            pathLen: tlv.OptionalField(2, tlv.UInt8),
        })),
        keyUsage: tlv.Field(2, tlv.UInt16),
        extendedKeyUsage: tlv.OptionalField(3, tlv.Array(tlv.UInt8)),
        subjectKeyIdentifier: tlv.Field(4, tlv.ByteString.bound({ length: 20 })),
        authorityKeyIdentifier: tlv.Field(5, tlv.ByteString.bound({ length: 20 })),
        futureExtension: tlv.OptionalField(6, tlv.ByteString),
    })),
    signature: tlv.Field(11, tlv.ByteString),
});

export const TlvOperationalCertificate = tlv.Object({
    serialNumber: tlv.Field(1, tlv.ByteString.bound({ maxLength: 20 })),
    signatureAlgorithm: tlv.Field(2, tlv.UInt8),
    issuer: tlv.Field(3, tlv.List({
        issuerRcacId: tlv.OptionalField(20, tlv.UInt64),
    })),
    notBefore: tlv.Field(4, tlv.UInt32),
    notAfter: tlv.Field(5, tlv.UInt32),
    subject: tlv.Field(6, tlv.List({
        fabricId: tlv.Field(21, tlv.UInt64),
        nodeId: tlv.Field(17, TlvNodeId),
    })),
    publicKeyAlgorithm: tlv.Field(7, tlv.UInt8),
    ellipticCurveIdentifier: tlv.Field(8, tlv.UInt8),
    ellipticCurvePublicKey: tlv.Field(9, tlv.ByteString),
    extensions: tlv.Field(10, tlv.List({
        basicConstraints: tlv.Field(1,  tlv.Object({
            isCa: tlv.Field(1,  tlv.Boolean),
            pathLen: tlv.OptionalField(2, tlv.UInt8),
        })),
        keyUsage: tlv.Field(2, tlv.UInt16),
        extendedKeyUsage: tlv.OptionalField(3, tlv.Array(tlv.UInt8)),
        subjectKeyIdentifier: tlv.Field(4, tlv.ByteString.bound({ length: 20 })),
        authorityKeyIdentifier: tlv.Field(5, tlv.ByteString.bound({ length: 20 })),
        futureExtension: tlv.OptionalField(6, tlv.ByteString),
    })),
    signature: tlv.Field(11, tlv.ByteString),
});

export type RootCertificate = tlv.TypeFromSchema<typeof TlvRootCertificate>;
export type OperationalCertificate = tlv.TypeFromSchema<typeof TlvOperationalCertificate>;
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

    static getPublicKeyFromCsr(csr: util.ByteArray) {
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
