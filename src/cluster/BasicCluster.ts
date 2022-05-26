import { PrimitiveType } from "../codec/TlvCodec";
import { Attribute } from "../model/Attribute";
import { Cluster } from "../model/Cluster";

interface BasicClusterConf {
    vendorName: string,
    vendorId: number,
    productName: string,
    productId: number,
}

export class BasicCluster extends Cluster {
    constructor({ vendorName, vendorId, productName, productId }: BasicClusterConf) {
        super(
            0x28,
            "Basic",
            [],
            [
                new Attribute(1, "VendorName", PrimitiveType.String, vendorName),
                new Attribute(2, "VendorID", PrimitiveType.UnsignedInt, vendorId),
                new Attribute(3, "ProductName", PrimitiveType.String, productName),
                new Attribute(4, "ProductID", PrimitiveType.UnsignedInt, productId),
            ],
        );
    }
}
