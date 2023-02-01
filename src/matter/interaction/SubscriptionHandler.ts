/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { InteractionServerMessenger } from "./InteractionMessenger";
import { Fabric } from "../fabric/Fabric";
import { AttributeWithPath, AttributePath, INTERACTION_PROTOCOL_ID } from "./InteractionServer";
import { Time, Timer } from "../../time/Time";
import { NodeId } from "../common/NodeId";
import { TlvSchema } from "@project-chip/matter.js";
import { Logger } from "../../log/Logger";

const logger = Logger.get("SubscriptionHandler");

interface PathValueVersion<T> {
    path: AttributePath,
    schema: TlvSchema<T>,
    valueVersion: { value: T, version: number },
}

export class SubscriptionHandler {

    static Builder = (server: MatterDevice, fabric: Fabric, peerNodeId: NodeId, attributes: AttributeWithPath[], minIntervalFloorSeconds: number, maxIntervalCeilingSeconds: number) => (subscriptionId: number) => new SubscriptionHandler(subscriptionId, server, fabric, peerNodeId, attributes, minIntervalFloorSeconds * 1000, maxIntervalCeilingSeconds * 1000);

    private lastUpdateTimeMs = 0;
    private readonly listener = () => this.sendUpdate();
    private updateTimer: Timer;

    constructor(
        readonly subscriptionId: number,
        private readonly server: MatterDevice,
        private readonly fabric: Fabric,
        private readonly peerNodeId: NodeId,
        private readonly attributes: AttributeWithPath[],
        private readonly minIntervalFloorMs: number,
        private readonly maxIntervalCeilingMs: number,
    ) {
        attributes.forEach(({ attribute }) => attribute.addMatterListener(this.listener));
        this.updateTimer = Time.getTimer(this.minIntervalFloorMs, () => this.sendUpdate()).start();
    }

    async sendUpdate() {
        const now = Date.now();
        const timeSinceLastUpdateMs = now - this.lastUpdateTimeMs;
        if (timeSinceLastUpdateMs < this.minIntervalFloorMs) {
            this.updateTimer.stop();
            this.updateTimer = Time.getTimer(this.minIntervalFloorMs - timeSinceLastUpdateMs, () => this.sendUpdate()).start();
            return;
        }

        const values = this.attributes.map(({ attribute, path }) => ({ path, valueVersion: attribute.getWithVersion(), schema: attribute.schema }));
        await this.sendUpdateMessage(values);
        this.lastUpdateTimeMs = now;

        this.updateTimer.stop();
        this.updateTimer = Time.getTimer(this.maxIntervalCeilingMs, () => this.sendUpdate()).start();
    }

    cancel() {
        this.attributes.forEach(({ attribute }) => attribute.removeMatterListener(this.listener));
        this.updateTimer.stop();
    }

    private async sendUpdateMessage(values: PathValueVersion<any>[]) {
        const exchange = this.server.initiateExchange(this.fabric, this.peerNodeId, INTERACTION_PROTOCOL_ID);
        if (exchange === undefined) return;
        logger.debug(`Sending subscription changes: ${Logger.toJSON(values)}`);
        const messenger = new InteractionServerMessenger(exchange);
        await messenger.sendDataReport({
            subscriptionId: this.subscriptionId,
            interactionModelRevision: 1,
            values: values.map(({ path, schema, valueVersion: { value, version } }) => ({
                value: {
                    path,
                    version,
                    value: schema.encodeTlv(value),
                },
            })),
        });
        await messenger.waitForSuccess();
        messenger.close();
    }
}
