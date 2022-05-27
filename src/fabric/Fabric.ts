export class Fabric {
    private vendorId?: number;
    private rootCert?: Buffer;
    private icaCert?: Buffer;
    private nocCert?: Buffer;

    constructor() {}

    setRootCert(certificate: Buffer) {
        this.rootCert = certificate;
    }

    setNocCert(certificate: Buffer) {
        this.nocCert = certificate;
    }

    setIcaCert(certificate: Buffer) {
        this.icaCert = certificate;
    }

    setVendorId(vendorId: number) {
        this.vendorId = vendorId;
    }

    getCompressedId():bigint {
        return BigInt(0);
    }
}