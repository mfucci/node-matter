import { TlvObjectCodec } from "../codec/TlvObjectCodec";
import { Crypto } from "../crypto/Crypto";
import { FabricBuilder } from "../fabric/Fabric";
import { getFabricManager } from "../fabric/FabricManager";
import { getMdnsServer } from "../mdns/MdnsServer";
import { Cluster } from "../model/Cluster";
import { Command, NoResponseT } from "../model/Command";
import { Session } from "../session/SessionManager";
import { AddNocRequestT, AddTrustedRootCertificateRequestT, AttestationResponseT, AttestationT, CertificateChainRequestT, CertificateChainResponseT, CertificateSigningRequestT, CertificateType, CsrResponseT, RequestWithNonceT, Status, StatusResponseT } from "./OperationalCredentialsMessages";

// Chip-Test-DAC-FFF1-8000-0007-Key.der
const DeviceAttestationCertificatePrivateKey = Buffer.from("727F1005CBA47ED7822A9D930943621617CFD3B79D9AF528B801ECF9F1992204", "hex");

// Chip-Test-DAC-FFF1-8000-0007-Cert.der
const DeviceAttestationCertificate = Buffer.from("308201e83082018fa0030201020208143c9d1689f498f0300a06082a8648ce3d04030230463118301606035504030c0f4d617474657220546573742050414931143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303020170d3231303632383134323334335a180f39393939313233313233353935395a304b311d301b06035504030c144d6174746572205465737420444143203030303731143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303059301306072a8648ce3d020106082a8648ce3d0301070342000462e2b6e1baff8d74a6fd8216c4cb67a3363a31e691492792e61aee610261481396725ef95e142686ba98f339b0ff65bc338bec7b9e8be0bdf3b2774982476220a360305e300c0603551d130101ff04023000300e0603551d0f0101ff040403020780301d0603551d0e04160414ee95ad96983a9ea95bcd2b00dc5e671727690383301f0603551d23041830168014af42b7094debd515ec6ecf33b81115225f325288300a06082a8648ce3d040302034700304402202f51cf53bf7777df7318094b9db595eebf2fa881c8c572847b1e689ece654264022029782708ee6b32c7f08ff63dbe618e9a580bb14c183bc288777adf9e2dcff5e6", "hex");

// Chip-Test-PAI-FFF1-8000-Cert.der
const ProductAttestationIntermediateCertificate = Buffer.from("308201d43082017aa00302010202083e6ce6509ad840cd300a06082a8648ce3d04030230303118301606035504030c0f4d617474657220546573742050414131143012060a2b0601040182a27c02010c04464646313020170d3231303632383134323334335a180f39393939313233313233353935395a30463118301606035504030c0f4d617474657220546573742050414931143012060a2b0601040182a27c02010c044646463131143012060a2b0601040182a27c02020c04383030303059301306072a8648ce3d020106082a8648ce3d0301070342000480ddf11b228f3e31f63bcf5798da14623aebbde82ef378eeadbfb18fe1abce31d08ed4b20604b6ccc6d9b5fab64e7de10cb74be017c9ec1516056d70f2cd0b22a366306430120603551d130101ff040830060101ff020100300e0603551d0f0101ff040403020106301d0603551d0e04160414af42b7094debd515ec6ecf33b81115225f325288301f0603551d230418301680146afd22771f511fecbf1641976710dcdc31a1717e300a06082a8648ce3d040302034800304502210096c9c8cf2e01886005d8f5bc72c07b75fd9a57695ac4911131138bea033ce50302202554943be57d53d6c475f7d23ebfcfc2036cd29ba6393ec7efad8714ab718219", "hex");

const CertificateDeclaration = Buffer.from("3082021906092a864886f70d010702a082020a30820206020103310d300b06096086480165030402013082017106092a864886f70d010701a08201620482015e152400012501f1ff3602050080050180050280050380050480050580050680050780050880050980050a80050b80050c80050d80050e80050f80051080051180051280051380051480051580051680051780051880051980051a80051b80051c80051d80051e80051f80052080052180052280052380052480052580052680052780052880052980052a80052b80052c80052d80052e80052f80053080053180053280053380053480053580053680053780053880053980053a80053b80053c80053d80053e80053f80054080054180054280054380054480054580054680054780054880054980054a80054b80054c80054d80054e80054f80055080055180055280055380055480055580055680055780055880055980055a80055b80055c80055d80055e80055f80056080056180056280056380182403162c04135a494732303134325a423333303030332d32342405002406002507942624080018317d307b020103801462fa823359acfaa9963e1cfa140addf504f37160300b0609608648016503040201300a06082a8648ce3d04030204473045022024e5d1f47a7d7b0d206a26ef699b7c9757b72d469089de3192e678c745e7f60c022100f8aa2fa711fcb79b97e397ceda667bae464e2bd3ffdfc3cced7aa8ca5f4c1a7c", "hex");

export class OperationalCredentialsCluster extends Cluster {
    private fabricBuilder?: FabricBuilder;

    constructor() {
        super(
            0x3e,
            "Operational Credentials",
            [
                new Command(0, 1, "AttestationRequest", RequestWithNonceT, AttestationResponseT, ({nonce}, session) => this.handleAttestationRequest(nonce, session)),
                new Command(2, 3, "CertificateChainRequest", CertificateChainRequestT, CertificateChainResponseT, ({type}) => this.handleCertificateChainRequest(type)),
                new Command(4, 5, "CSRRequest", RequestWithNonceT, CsrResponseT, ({nonce}, session) => this.handleCertificateSignRequest(nonce, session)),
                new Command(6, 8, "AddNOC", AddNocRequestT, StatusResponseT, ({nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId}, session) => this.addNewOperationalCertificates(nocCert, icaCert, ipkValue, caseAdminNode, adminVendorId, session)),
                new Command(11, 11, "AddTrustedRootCertificate", AddTrustedRootCertificateRequestT, NoResponseT, ({certificate}) => this.addTrustedRootCertificate(certificate)),
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
                throw new Error(`Unsupported certificate type: ${type}`);
        }
    }

    private handleCertificateSignRequest(nonce: Buffer, session: Session) {
        this.fabricBuilder = new FabricBuilder();
        const csr = this.fabricBuilder.createCertificateSigningRequest();
        const elements = TlvObjectCodec.encode({ csr, nonce }, CertificateSigningRequestT);
        return {elements, signature: this.signWithDeviceKey(session, elements)};
    }

    private async addNewOperationalCertificates(nocCert: Buffer, icaCert: Buffer, ipkValue: Buffer, caseAdminNode: bigint, adminVendorId: number, session: Session) {
        if (this.fabricBuilder === undefined) throw new Error("CSRRequest and AddTrustedRootCertificate should be called first!")

        this.fabricBuilder.setNewOpCert(nocCert);
        if (icaCert.length > 0) this.fabricBuilder.setIntermediateCACert(icaCert);
        this.fabricBuilder.setVendorId(adminVendorId);
        this.fabricBuilder.setIdentityProtectionKey(ipkValue);

        const fabric = await this.fabricBuilder.build();
        this.fabricBuilder = undefined;
        getFabricManager().addFabric(fabric);
        session.setFabric(fabric);

        // TODO: create ACL with caseAdminNode

        getMdnsServer().announceDevice(fabric);

        return {status: Status.Success};
    }

    private addTrustedRootCertificate(certificate: Buffer) {
        if (this.fabricBuilder === undefined) throw new Error("CSRRequest should be called first!")
        this.fabricBuilder.setRootCert(certificate);
    }

    private signWithDeviceKey(session: Session, data: Buffer) {
        return Crypto.sign(DeviceAttestationCertificatePrivateKey, [data, session.getAttestationChallengeKey()]);
    }
}
