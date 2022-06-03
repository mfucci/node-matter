import { DerCodec, END_MARKER } from "../codec/DerCodec";
import { Crypto, KeyPair } from "./Crypto";

const ORGANIZATION_NAME_ID = {_objectId: Buffer.from("55040A", "hex")};
const EC_PUBLIC_KEY_ID = {_objectId: Buffer.from("2A8648CE3D0201", "hex")};
const CURVE_P256_V1_ID = {_objectId: Buffer.from("2A8648CE3D030107", "hex")};
const ECDSA_WITH_SHA256_ID = {_objectId: Buffer.from("2A8648CE3D040302", "hex")};

export class X509 {
    static createCertificateSigningRequest(keys: KeyPair) {
        const request = {
            version: 0,
            subject: {
                organization: [{ id: ORGANIZATION_NAME_ID, name: "CSR" }],
            },
            publicKey: {
                type: { algorithm: EC_PUBLIC_KEY_ID, curve: CURVE_P256_V1_ID },
                bytes: keys.publicKey,
            },
            endSignedBytes: END_MARKER,
        };

        return DerCodec.encode({
            request,
            signAlgorithm: { algorithm: ECDSA_WITH_SHA256_ID },
            signature: Crypto.sign(keys.privateKey, DerCodec.encode(request), "der"),
        });
    }
}
