/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */
import { VendorId } from "../common/VendorId";
import { CertificateManager, TlvCertificationDeclaration } from "./CertificateManager";
import { ByteArray } from "@project-chip/matter.js";

const sTestCMS_SignerPrivateKey = ByteArray.fromHex("30770201010420aef3484116e9481ec57be0472df41bf499064e5024ad869eca5e889802d48075a00a06082a8648ce3d030107a144034200043c398922452b55caf389c25bd1bca4656952ccb90e8869249ad8474653014cbf95d687965e036b521c51037e6b8cedefca1eb44046694fa08882eed6519decba")

const sTestCMS_SignerSubjectKeyIdentifier = ByteArray.fromHex("62FA823359ACFAA9963E1CFA140ADDF504F37160");

const sTestCMS_Certificate = ByteArray.fromHex("308201b33082015aa003020102020845daf39de47aa08f300a06082a8648ce3d040302302b3129302706035504030c204d61747465722054657374204344205369676e696e6720417574686f726974793020170d3231303632383134323334335a180f39393939313233313233353935395a302b3129302706035504030c204d61747465722054657374204344205369676e696e6720417574686f726974793059301306072a8648ce3d020106082a8648ce3d030107034200043c398922452b55caf389c25bd1bca4656952ccb90e8869249ad8474653014cbf95d687965e036b521c51037e6b8cedefca1eb44046694fa08882eed6519decbaa366306430120603551d130101ff040830060101ff020101300e0603551d0f0101ff040403020106301d0603551d0e0416041462fa823359acfaa9963e1cfa140addf504f37160301f0603551d2304183016801462fa823359acfaa9963e1cfa140addf504f37160300a06082a8648ce3d040302034700304402202c545ce4e457d8a6f0d9d9bbebd6ece1ddfe7f8c6d9a6cf375321fc6fac713840220540778e8743972527eedebaf58686220b54078f2cd4e62a76ae7cbb92ff54c8b");

/**
 * From DeviceAttestationCredsExample.cpp
 * Certificate Declaration with Vendor ID 0xFFF1 and Product IDs 0x8000-0x8063
 * There are included here for reference and are no longer used in the code
 */
const CertificateDeclaration = ByteArray.fromHex("3082021706092a864886f70d010702a082020830820204020103310d300b06096086480165030402013082017006092a864886f70d010701a08201610482015d152400012501f1ff3602050080050180050280050380050480050580050680050780050880050980050a80050b80050c80050d80050e80050f80051080051180051280051380051480051580051680051780051880051980051a80051b80051c80051d80051e80051f80052080052180052280052380052480052580052680052780052880052980052a80052b80052c80052d80052e80052f80053080053180053280053380053480053580053680053780053880053980053a80053b80053c80053d80053e80053f80054080054180054280054380054480054580054680054780054880054980054a80054b80054c80054d80054e80054f80055080055180055280055380055480055580055680055780055880055980055a80055b80055c80055d80055e80055f80056080056180056280056380182403162c0413435341303030303053574330303030302d303024050024060024070124080018317c307a0201038014fe343f959947763b61ee4539131338494fe67d8e300b0609608648016503040201300a06082a8648ce3d0403020446304402204a12f8d42f90235c05a77121cbebae15d590146558e9c9b47a1a38f7a36a7dc5022020a4742897c30aeda0a56b36e14ebbc85bbdb74493f993581eb0444ed6ca940b");

export class CertificationDeclarationManager {
    static generate(vendorId: VendorId, productId: number) {
        const certificationElements = TlvCertificationDeclaration.encode({
            formatVersion: 1,
            vendorId,
            produceIdArray: [ productId ],
            deviceTypeId: 22,
            certificateId: "CSA00000SWC00000-00",
            securityLevel: 0,
            securityInformation: 0,
            versionNumber: 1,
            certificationType: 0,
        });

        return CertificateManager.CertificationDeclarationToAsn1(certificationElements, sTestCMS_SignerSubjectKeyIdentifier, sTestCMS_SignerPrivateKey);
    }
}

