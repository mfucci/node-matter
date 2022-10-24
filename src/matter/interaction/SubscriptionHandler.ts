import { MatterDevice } from "../MatterDevice";
import { InteractionServerMessenger } from "./InteractionMessenger";
import { Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Element } from "../../codec/TlvCodec";
import { Fabric } from "../fabric/Fabric";
import { AttributeWithPath, Path, INTERACTION_PROTOCOL_ID } from "./InteractionServer";
import { Time, Timer } from "../../time/Time";

interface PathValueVersion<T> {
    path: Path,
    template: Template<T>,
    valueVersion: { value: T, version: number },
}

export class SubscriptionHandler {

    static Builder = (server: MatterDevice, fabric: Fabric, peerNodeId: bigint, attributes: AttributeWithPath[], minIntervalFloorSeconds: number, maxIntervalCeilingSeconds: number) => (subscriptionId: number) => new SubscriptionHandler(subscriptionId, server, fabric, peerNodeId, attributes, minIntervalFloorSeconds * 1000, maxIntervalCeilingSeconds * 1000);

    private lastUpdateTimeMs = 0;
    private readonly listener = () => this.sendUpdate();
    private updateTimer: Timer;

    constructor(
        readonly subscriptionId: number,
        private readonly server: MatterDevice,
        private readonly fabric: Fabric,
        private readonly peerNodeId: bigint,
        private readonly attributes: AttributeWithPath[],
        private readonly minIntervalFloorMs: number,
        private readonly maxIntervalCeilingMs: number,
    ) {
        attributes.forEach(({ attribute }) => attribute.addMatterListener(this.listener));
        this.updateTimer = Time.get().getTimer(this.minIntervalFloorMs, () => this.sendUpdate()).start();
        this.updateTimer.start();
    }

    async sendUpdate() {
        const now = Date.now();
        const timeSinceLastUpdateMs = now - this.lastUpdateTimeMs;
        if (timeSinceLastUpdateMs < this.minIntervalFloorMs) {
            this.updateTimer.stop();
            this.updateTimer = Time.get().getTimer(setTimeout(() => this.sendUpdate(), this.minIntervalFloorMs - timeSinceLastUpdateMs);
            return;
        }

        const values = this.attributes.map(({ attribute, path }) => ({ path, valueVersion: attribute.getWithVersion(), template: attribute.template }));
        await this.sendUpdateMessage(values);
        this.lastUpdateTimeMs = now;

        clearTimeout(this.updateTimer);
        this.updateTimer = setTimeout(() => this.sendUpdate(), this.maxIntervalCeilingMs);
    }

    cancel() {
        this.attributes.forEach(({ attribute }) => attribute.removeMatterListener(this.listener));
        clearTimeout(this.updateTimer);
    }

    private async sendUpdateMessage(values: PathValueVersion<any>[]) {
        const exchange = this.server.initiateExchange(this.fabric, this.peerNodeId, INTERACTION_PROTOCOL_ID);
        if (exchange === undefined) return;
        const messenger = new InteractionServerMessenger(exchange);
        await messenger.sendDataReport({
            subscriptionId: this.subscriptionId,
            interactionModelRevision: 1,
            values: values.map(({ path, template, valueVersion: { value, version } }) => ({
                value: {
                    path,
                    version,
                    value: TlvObjectCodec.encodeElement(value, template) as Element,
                },
            })),
        });
        await messenger.waitForSuccess();
        messenger.close();
    }
}
