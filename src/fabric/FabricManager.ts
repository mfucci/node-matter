import { Singleton } from "../util/Singleton";
import { Fabric } from "./Fabric";

export const getFabricManager = Singleton(() => new FabricManager());

export class FabricManager {
    addFabric(fabric: Fabric): number {
        return 0;
    }

}
