import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Crypto, KeyPair } from "../crypto/Crypto";
import { X509 } from "../crypto/X509";
import { NewOpCertificateT } from "./NewOpCertificate";

export const enum KeySetType {
    IdentityProtection,
}

export class KeySet {
    private readonly keys = new Array<Buffer>();

    constructor(
        readonly type: KeySetType,
        private readonly policy: Policy,
        key: Buffer,
    ) {
        this.keys.push(key);
    }

    getKeys() {
        return this.keys;
    }
}

export const enum Policy {
    trustFirst = 0,
    cacheAndSync = 1,
};

export class Fabric {
    private readonly keySets = new Array<KeySet>();

    constructor(
        readonly id: number,
        readonly nodeId: number,
        readonly rootPublicKey: Buffer,
        private readonly keyPair: KeyPair,
        private readonly vendorId: number,
        private readonly rootCert: Buffer,
        readonly intermediateCACert: Buffer | undefined,
        readonly newOpCert: Buffer,
    ) {}

    getCompressedId():bigint {
        return BigInt(0);
    }

    addKeySet(keySet: KeySet) {
        this.keySets.push(keySet);
    }

    getIdentityProtectionKeySet() {
        return this.keySets.find(keyset => keyset.type === KeySetType.IdentityProtection);
    }

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
}

export class FabricBuilder {
    private keyPair = Crypto.createKeyPair();
    private vendorId?: number;
    private rootCert?: Buffer;
    private intermediateCACert?: Buffer;
    private newOpCert?: Buffer;
    private fabricId?: number;
    private nodeId?: number;
    private rootPublicKey?: Buffer;

    createCertificateSigningRequest() {
        return X509.createCertificateSigningRequest(this.keyPair);
    }

    setRootCert(certificate: Buffer) {
        this.rootCert = certificate;
    }

    setNewOpCert(nocCerticate: Buffer) {
        this.newOpCert = nocCerticate;
        const {subject: {nodeId, fabricId}, ellipticCurvePublicKey } = TlvObjectCodec.decode(nocCerticate, NewOpCertificateT);
        this.fabricId = fabricId;
        this.nodeId = nodeId;
        this.rootPublicKey = ellipticCurvePublicKey;
    }

    setInetmediateCACert(certificate: Buffer) {
        this.intermediateCACert = certificate;
    }

    setVendorId(vendorId: number) {
        this.vendorId = vendorId;
    }

    build() {
        if (this.vendorId === undefined) throw new Error("vendorId needs to be set");
        if (this.rootCert === undefined) throw new Error("rootCert needs to be set");
        if (this.newOpCert === undefined || this.fabricId === undefined || this.nodeId === undefined || this.rootPublicKey === undefined) throw new Error("nocCert needs to be set");
        return new Fabric(
            this.fabricId,
            this.nodeId,
            this.rootPublicKey,
            this.keyPair,
            this.vendorId,
            this.rootCert,
            this.intermediateCACert,
            this.newOpCert,
        );
    }
}
