import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Crypto } from "../crypto/Crypto";
import { FabricBuilder, KeySet, KeySetType, Policy } from "../fabric/Fabric";
import { Cluster } from "../model/Cluster";
import { Command } from "../model/Command";
import { Session } from "../session/SessionManager";
import { AddNocRequestT, AddTrustedRootCertificateRequestT, AttestationResponseT, AttestationT, CertificateChainRequestT, CertificateChainResponseT, CertificateSigningRequestT, CertificateType, CsrResponseT, RequestWithNonceT, Status, StatusResponseT } from "./OperationalCredentialsMessages";

// Chip-Test-DAC-FFF1-8000-000A-Key.pem
const DeviceAttestationCertificatePrivateKey = Buffer.from("05c6c3a84dc605cc3cc8058009b01b329cf60cf15970c6a90eadaae2de49649e", "hex");

// Chip-Test-DAC-FFF1-8000-000A-Cert.pem
const DeviceAttestationCertificate = Buffer.from("308201EA3082018FA0030201020208051A69E5E780343E300A06082A8648CE3D04030230463118301606035504030C0F4D617474657220546573742050414931143012060A2B0601040182A27C02010C044646463131143012060A2B0601040182A27C02020C04383030303020170D3231303632383134323334335A180F39393939313233313233353935395A304B311D301B06035504030C144D6174746572205465737420444143203030304131143012060A2B0601040182A27C02010C044646463131143012060A2B0601040182A27C02020C04383030303059301306072A8648CE3D020106082A8648CE3D030107034200047A8458AFBB9BCD15E19ADCD266F66C9C2F607C74747A35F80F37E118133F80F1760113278F91F15AA0F7F87932094FE69FB72868A81E26979B368B33B5543103A360305E300C0603551D130101FF04023000300E0603551D0F0101FF040403020780301D0603551D0E04160414D5ADB2B8838EC8073C4772DC7E8797FEBB23B3AE301F0603551D2304183016801484F51DFF9ECCDA29359448520E85F1292DA3EDD7300A06082A8648CE3D0403020349003046022100F2FE1679643F4C5BCA762E8A3415ED513006FCD052DA506D62D8BD515E37BD08022100BE2DB47AAB3375178E1249A07920A0AC6EAA392F07F16D84FDCB52DBAF28D7D9", "hex");

// Chip-Test-PAI-FFF1-8000-Cert.pem
const ProductAttestationIntermediateCertificate = Buffer.from("308201BF30820166A00302010202087E992A4D89840515300A06082A8648CE3D040302301F311D301B06035504030C144D617474657220546573742050414120464646313020170D3231303632383134323334335A180F39393939313233313233353935395A30463118301606035504030C0F4D617474657220546573742050414931143012060A2B0601040182A27C02010C044646463131143012060A2B0601040182A27C02020C04383030303059301306072A8648CE3D020106082A8648CE3D03010703420004CA73CE4641BF083B4A338DA0431A0A32307F66D160574B66122F2506CF6AD370E37F65D6347AE797A197265050976D34AC7B637B3BDA0B5BD843ED8E5D5E9BF2A3633061300F0603551D130101FF040530030101FF300E0603551D0F0101FF040403020106301D0603551D0E0416041484F51DFF9ECCDA29359448520E85F1292DA3EDD7301F0603551D23041830168014EF18E0ECD4660434DF0DBC911ED452169966839F300A06082A8648CE3D0403020347003044022059467CB5AAFC1A52B543896DD23BDE45D0806C53A7379CE712E4A80AAD67AB5A02203F9AFF34BFEF2656D39BFAD17658246B36596C32E6C06A357ECAE9106F793475", "hex");

const CertificateDeclaration = Buffer.from("33082021906092a864886f70d010702a082020a30820206020103310d300b06096086480165030402013082017106092a864886f70d010701a08201620482015e152400012501f1ff3602050080050180050280050380050480050580050680050780050880050980050a80050b80050c80050d80050e80050f80051080051180051280051380051480051580051680051780051880051980051a80051b80051c80051d80051e80051f80052080052180052280052380052480052580052680052780052880052980052a80052b80052c80052d80052e80052f80053080053180053280053380053480053580053680053780053880053980053a80053b80053c80053d80053e80053f80054080054180054280054380054480054580054680054780054880054980054a80054b80054c80054d80054e80054f80055080055180055280055380055480055580055680055780055880055980055a80055b80055c80055d80055e80055f80056080056180056280056380182403162c04135a494732303134325a423333303030332d32342405002406002507942624080018317d307b020103801462fa823359acfaa9963e1cfa140addf504f37160300b0609608648016503040201300a06082a8648ce3d04030204473045022024e5d1f47a7d7b0d206a26ef699b7c9757b72d469089de3192e678c745e7f60c022100f8aa2fa711fcb79b97e397ceda667bae464e2bd3ffdfc3cced7aa8ca5f4c1a7c", "hex");

export class OperationalCredentialsCluster extends Cluster {
    private farbicBuilder?: FabricBuilder;

    constructor() {
        super(
            0x3e,
            "Operational Credentials",
            [
                new Command(0, "AttestationRequest", RequestWithNonceT, AttestationResponseT, ({nonce}, session) => this.handleAttestationRequest(nonce, session)),
                new Command(2, "CertificateChainRequest", CertificateChainRequestT, CertificateChainResponseT, ({type}) => this.handleCertificateChainRequest(type)),
                new Command(4, "CSRRequest", RequestWithNonceT, CsrResponseT, ({nonce}, session) => this.handleCertificateSignRequest(nonce, session)),
                new Command(6, "AddNOC", AddNocRequestT, StatusResponseT, ({nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId}, session) => this.addNewOperationalCertificates(nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId, session)),
                new Command(11, "AddTrustedRootCertificate", AddTrustedRootCertificateRequestT, StatusResponseT, ({certificate}) => this.addTrustedRootCertificate(certificate)),
            ],
            [],
        );
    }

    private handleAttestationRequest(nonce: Buffer, session: Session) {
        const elements = TlvObjectCodec.encode({ declaration: CertificateDeclaration, nonce, timestamp: 0 }, AttestationT);
        return {elements: elements, signature: this.signWithDeviceKey(session, elements)};
    }

    private handleCertificateChainRequest(type: CertificateType) {
        switch (type) {
            case CertificateType.DeviceAttestation:
                return {certificate: DeviceAttestationCertificate};
            case CertificateType.ProductAttestationIntermediate:
                return {certificate: ProductAttestationIntermediateCertificate};
            default:
                throw new Error(`Unsupported certificate type${type}`);
        }
    }

    private handleCertificateSignRequest(nonce: Buffer, session: Session) {
        this.farbicBuilder = new FabricBuilder();
        const csr = this.farbicBuilder.createCertificateSigningRequestr();
        const elements = TlvObjectCodec.encode({ csr, nonce }, CertificateSigningRequestT);
        return {elements, signature: this.signWithDeviceKey(session, elements)};
    }

    private addNewOperationalCertificates(nocCert: Buffer, icaCert: Buffer, ipkValue: Buffer, caseAdminNode: bigint, adminVendorId: number, session: Session) {
        if (this.farbicBuilder === undefined) throw new Error("CSRRequest and AddTrustedRootCertificate should be called first!")

        this.farbicBuilder.setNewOpCert(nocCert);
        this.farbicBuilder.setInetmediateCACert(icaCert);
        this.farbicBuilder.setVendorId(adminVendorId);

        const fabric = this.farbicBuilder.build();
        this.farbicBuilder = undefined;
        fabric.addKeySet(new KeySet(KeySetType.IdentityProtection, Policy.trustFirst, ipkValue))

        session.setFabric(fabric);

        // TODO: create ACL with caseAdminNode

        return {status: Status.Success};
    }

    private addTrustedRootCertificate(certificate: Buffer) {
        if (this.farbicBuilder === undefined) throw new Error("CSRRequest should be called first!")
        this.farbicBuilder.setRootCert(certificate);
        return {status: Status.Success};
    }

    private signWithDeviceKey(session: Session, data: Buffer) {
        return Crypto.sign(DeviceAttestationCertificatePrivateKey, [data, session.getAttestationChallengeKey()]);
    }
}
