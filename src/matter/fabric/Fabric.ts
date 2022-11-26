/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Crypto, KeyPair } from "../../crypto/Crypto";
import { CertificateManager, TlvOperationalCertificate, TlvRootCertificate } from "../certificate/CertificateManager";
import { NodeId } from "../common/NodeId";
import { VendorId } from "../common/VendorId";
import { util } from "@project-chip/matter.js";

const COMPRESSED_FABRIC_ID_INFO = util.ByteArray.fromString("CompressedFabric");
const GROUP_SECURITY_INFO = util.ByteArray.fromString("GroupKey v1.0");

export class Fabric {

    constructor(
        readonly id: bigint | number,
        readonly nodeId: NodeId,
        readonly operationalId: util.ByteArray,
        readonly rootPublicKey: util.ByteArray,
        private readonly keyPair: KeyPair,
        private readonly vendorId: VendorId,
        private readonly rootCert: util.ByteArray,
        readonly identityProtectionKey: util.ByteArray,
        readonly operationalIdentityProtectionKey: util.ByteArray,
        readonly intermediateCACert: util.ByteArray | undefined,
        readonly operationalCert: util.ByteArray,
    ) {}

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    sign(data: util.ByteArray) {
        return Crypto.sign(this.keyPair.privateKey, data);
    }

    verifyCredentials(operationalCert: util.ByteArray, intermediateCACert: util.ByteArray | undefined) {
        // TODO: implement verification
        return;
    }

    getDestinationId(nodeId: NodeId, random: util.ByteArray) {
        const writer = new util.DataWriter(util.Endian.Little);
        writer.writeByteArray(random);
        writer.writeByteArray(this.rootPublicKey);
        writer.writeUInt64(this.id);
        writer.writeUInt64(nodeId.id);
        return Crypto.hmac(this.operationalIdentityProtectionKey, writer.toByteArray());
    }
}

export class FabricBuilder {
    private keyPair = Crypto.createKeyPair();
    private vendorId?: VendorId;
    private rootCert?: util.ByteArray;
    private intermediateCACert?: util.ByteArray;
    private operationalCert?: util.ByteArray;
    private fabricId?: bigint | number;
    private nodeId?: NodeId;
    private rootPublicKey?: util.ByteArray;
    private identityProtectionKey?: util.ByteArray;

    getPublicKey() {
        return this.keyPair.publicKey;
    }

    createCertificateSigningRequest() {
        return CertificateManager.createCertificateSigningRequest(this.keyPair);
    }

    setRootCert(rootCert: util.ByteArray) {
        this.rootCert = rootCert;
        this.rootPublicKey = TlvRootCertificate.decode(rootCert).ellipticCurvePublicKey;
        return this;
    }

    setOperationalCert(operationalCert: util.ByteArray) {
        this.operationalCert = operationalCert;
        const {subject: {nodeId, fabricId} } = TlvOperationalCertificate.decode(operationalCert);
        this.fabricId = fabricId;
        this.nodeId = nodeId;
        return this;
    }

    setIntermediateCACert(certificate: util.ByteArray) {
        this.intermediateCACert = certificate;
        return this;
    }

    setVendorId(vendorId: VendorId) {
        this.vendorId = vendorId;
        return this;
    }

    setIdentityProtectionKey(key: util.ByteArray) {
        this.identityProtectionKey = key;
        return this;
    }

    async build() {
        if (this.vendorId === undefined) throw new Error("vendorId needs to be set");
        if (this.rootCert === undefined || this.rootPublicKey === undefined) throw new Error("rootCert needs to be set");
        if (this.identityProtectionKey === undefined) throw new Error("identityProtectionKey needs to be set");
        if (this.operationalCert === undefined || this.fabricId === undefined || this.nodeId === undefined) throw new Error("operationalCert needs to be set");

        const saltWriter = new util.DataWriter(util.Endian.Big);
        saltWriter.writeUInt64(this.fabricId);
        const operationalId = await Crypto.hkdf(this.rootPublicKey.slice(1), saltWriter.toByteArray(), COMPRESSED_FABRIC_ID_INFO, 8);

        return new Fabric(
            this.fabricId,
            this.nodeId,
            operationalId,
            this.rootPublicKey,
            this.keyPair,
            this.vendorId,
            this.rootCert,
            this.identityProtectionKey,
            await Crypto.hkdf(this.identityProtectionKey, operationalId, GROUP_SECURITY_INFO, 16),
            this.intermediateCACert,
            this.operationalCert,
        );
    }
}
