/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Crypto, KeyPair } from "../../crypto/Crypto";
import { LEBufferWriter } from "../../util/LEBufferWriter";
import { CertificateManager, OperationalCertificateT, RootCertificateT } from "../certificate/CertificateManager";
import { NodeId, nodeIdToBigint } from "../common/NodeId";
import { VendorId } from "../common/VendorId";

const COMPRESSED_FABRIC_ID_INFO = Buffer.from("CompressedFabric");
const GROUP_SECURITY_INFO = Buffer.from("GroupKey v1.0");

export class Fabric {

    constructor(
        readonly id: bigint,
        readonly nodeId: NodeId,
        readonly rootNodeId: NodeId,
        readonly operationalId: Buffer,
        readonly rootPublicKey: Buffer,
        private readonly keyPair: KeyPair,
        readonly rootVendorId: VendorId,
        private readonly rootCert: Buffer,
        readonly identityProtectionKey: Buffer,
        readonly operationalIdentityProtectionKey: Buffer,
        readonly intermediateCACert: Buffer | undefined,
        readonly operationalCert: Buffer,
        public label: string,
    ) {}

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    sign(data: Buffer) {
        return Crypto.sign(this.keyPair.privateKey, data);
    }

    verifyCredentials(operationalCert: Buffer, intermediateCACert: Buffer | undefined) {
        // TODO: implement verification
        return;
    }

    getDestinationId(nodeId: NodeId, random: Buffer) {
        const writter = new LEBufferWriter();
        writter.writeBytes(random);
        writter.writeBytes(this.rootPublicKey);
        writter.writeUInt64(this.id);
        writter.writeUInt64(nodeIdToBigint(nodeId));
        const elements = writter.toBuffer();
        return Crypto.hmac(this.operationalIdentityProtectionKey, elements);
    }
}

export class FabricBuilder {
    private keyPair = Crypto.createKeyPair();
    private rootVendorId?: VendorId;
    private rootCert?: Buffer;
    private intermediateCACert?: Buffer;
    private operationalCert?: Buffer;
    private fabricId?: bigint;
    private nodeId?: NodeId;
    private rootNodeId?: NodeId;
    private rootPublicKey?: Buffer;
    private identityProtectionKey?: Buffer;

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    createCertificateSigningRequest() {
        return CertificateManager.createCertificateSigningRequest(this.keyPair);
    }

    setRootCert(rootCert: Buffer) {
        this.rootCert = rootCert;
        this.rootPublicKey = TlvObjectCodec.decode(rootCert, RootCertificateT).ellipticCurvePublicKey;
        return this;
    }

    setOperationalCert(operationalCert: Buffer) {
        this.operationalCert = operationalCert;
        const {subject: {nodeId, fabricId} } = TlvObjectCodec.decode(operationalCert, OperationalCertificateT);
        this.fabricId = fabricId;
        this.nodeId = nodeId;
        return this;
    }

    setIntermediateCACert(certificate: Buffer) {
        this.intermediateCACert = certificate;
        return this;
    }

    setRootVendorId(rootVendorId: VendorId) {
        this.rootVendorId = rootVendorId;
        return this;
    }

    setRootNodeId(rootNodeId: NodeId) {
        this.rootNodeId = rootNodeId;
        return this;
    }

    setIdentityProtectionKey(key: Buffer) {
        this.identityProtectionKey = key;
        return this;
    }

    async build() {
        if (this.rootVendorId === undefined) throw new Error("vendorId needs to be set");
        if (this.rootNodeId === undefined) throw new Error("rootNodeId needs to be set");
        if (this.rootCert === undefined || this.rootPublicKey === undefined) throw new Error("rootCert needs to be set");
        if (this.identityProtectionKey === undefined) throw new Error("identityProtectionKey needs to be set");
        if (this.operationalCert === undefined || this.fabricId === undefined || this.nodeId === undefined) throw new Error("operationalCert needs to be set");

        const operationalIdSalt = Buffer.alloc(8);
        operationalIdSalt.writeBigUInt64BE(BigInt(this.fabricId));
        const operationalId = await Crypto.hkdf(this.rootPublicKey.slice(1), operationalIdSalt, COMPRESSED_FABRIC_ID_INFO, 8);

        return new Fabric(
            this.fabricId,
            this.nodeId,
            this.rootNodeId,
            operationalId,
            this.rootPublicKey,
            this.keyPair,
            this.rootVendorId,
            this.rootCert,
            this.identityProtectionKey,
            await Crypto.hkdf(this.identityProtectionKey, operationalId, GROUP_SECURITY_INFO, 16),
            this.intermediateCACert,
            this.operationalCert,
            "",
        );
    }
}
