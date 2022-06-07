/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Crypto, KeyPair } from "../crypto/Crypto";
import { X509 } from "../crypto/X509";
import { LEBufferWriter } from "../util/LEBufferWriter";
import { CertificateT } from "./TlvCertificate";

const COMPRESSED_FABRIC_ID_INFO = Buffer.from("CompressedFabric");
const GROUP_SECURITY_INFO = Buffer.from("GroupKey v1.0");

export class Fabric {
    constructor(
        readonly id: bigint,
        readonly nodeId: bigint,
        readonly operationalId: Buffer,
        readonly rootPublicKey: Buffer,
        private readonly keyPair: KeyPair,
        private readonly vendorId: number,
        private readonly rootCert: Buffer,
        readonly identityProtectionKey: Buffer,
        readonly intermediateCACert: Buffer | undefined,
        readonly newOpCert: Buffer,
    ) {}

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    sign(data: Buffer) {
        return Crypto.sign(this.keyPair.privateKey, data);
    }

    verifyCredentials(initiatorNoc: Buffer, initiatorIcac: Buffer | undefined) {
        // TODO: implement verification
        return;
    }

    getDestinationId(random: Buffer) {
        const writter = new LEBufferWriter();
        writter.writeBytes(random);
        writter.writeBytes(this.rootPublicKey);
        writter.writeUInt64(BigInt(this.id));
        writter.writeUInt64(BigInt(this.nodeId));
        const elements = writter.toBuffer();
        return Crypto.hmac(this.identityProtectionKey, elements)
    }
}

export class FabricBuilder {
    private keyPair = Crypto.createKeyPair();
    private vendorId?: number;
    private rootCert?: Buffer;
    private intermediateCACert?: Buffer;
    private newOpCert?: Buffer;
    private fabricId?: bigint;
    private nodeId?: bigint;
    private rootPublicKey?: Buffer;
    private identityProtectionKey?: Buffer;

    createCertificateSigningRequest() {
        return X509.createCertificateSigningRequest(this.keyPair);
    }

    setRootCert(certificate: Buffer) {
        this.rootCert = certificate;
        this.rootPublicKey = TlvObjectCodec.decode(certificate, CertificateT).ellipticCurvePublicKey;
    }

    setNewOpCert(nocCerticate: Buffer) {
        this.newOpCert = nocCerticate;
        const {subject: {nodeId, fabricId} } = TlvObjectCodec.decode(nocCerticate, CertificateT);
        this.fabricId = fabricId;
        this.nodeId = nodeId;
    }

    setIntermediateCACert(certificate: Buffer) {
        this.intermediateCACert = certificate;
    }

    setVendorId(vendorId: number) {
        this.vendorId = vendorId;
    }

    setIdentityProtectionKey(key: Buffer) {
        this.identityProtectionKey = key;
    }

    async build() {
        if (this.vendorId === undefined) throw new Error("vendorId needs to be set");
        if (this.rootCert === undefined || this.rootPublicKey === undefined) throw new Error("rootCert needs to be set");
        if (this.identityProtectionKey === undefined) throw new Error("identityProtectionKey needs to be set");
        if (this.newOpCert === undefined || this.fabricId === undefined || this.nodeId === undefined) throw new Error("nocCert needs to be set");

        const operationalIdSalt = Buffer.alloc(8);
        operationalIdSalt.writeBigUInt64BE(BigInt(this.fabricId));
        const operationalId = await Crypto.hkdf(this.rootPublicKey.slice(1), operationalIdSalt, COMPRESSED_FABRIC_ID_INFO, 8);

        return new Fabric(
            this.fabricId,
            this.nodeId,
            operationalId,
            this.rootPublicKey,
            this.keyPair,
            this.vendorId,
            this.rootCert,
            await Crypto.hkdf(this.identityProtectionKey, operationalId, GROUP_SECURITY_INFO, 16),
            this.intermediateCACert,
            this.newOpCert,
        );
    }
}
