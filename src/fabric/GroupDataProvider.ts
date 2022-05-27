import { Singleton } from "../util/Singleton";
import { KeySet } from "./KeySet";

export const getGroupDataProvider = Singleton(() => new GroupDataProvider());

export class GroupDataProvider {
    setKetSet(fabricIndex: number, compressedFabricId: bigint, keySet: KeySet) {

    }
}