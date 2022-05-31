import { Singleton } from "../util/Singleton";
import { Fabric } from "./Fabric";

export const getFabricManager = Singleton(() => new FabricManager());

export class FabricManager {
    private readonly fabrics = new Array<Fabric>();

    addFabric(fabric: Fabric): number {
        this.fabrics.push(fabric);
        return this.fabrics.length - 1;
    }

    getFabrics() {
        return this.fabrics;
    }
}
