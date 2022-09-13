import { NetInterface } from "./common/NetInterface";

export class MatterClient {
    constructor(
        private readonly netInterface: NetInterface,
    ) {}

    async commission(address: string, discriminator: number) {
        throw new Error("Not yet implemented");
    }
}