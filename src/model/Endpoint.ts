import { Element } from "../codec/TlvCodec";
import { Session } from "../session/SessionManager";
import { Cluster } from "./Cluster";

export class Endpoint {
    private readonly clusters = new Map<number, Cluster>();

    constructor(
        readonly id: number,
        readonly name: string,
        clusters: Cluster[],
    ) {
        clusters.forEach(cluster => this.clusters.set(cluster.id, cluster));
    }

    getAttributeValue(clusterId: number, attributeId: number) {
        return this.clusters.get(clusterId)?.getAttributeValue(attributeId);
    }

    async invoke(session: Session, clusterId: number, commandId: number, args: Element): Promise<Element | undefined> {
        return this.clusters.get(clusterId)?.invoke(session, commandId, args);
    }
}
