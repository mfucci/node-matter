/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { InteractionServerMessenger } from "./InteractionMessenger";
import { Fabric } from "../fabric/Fabric";
import { AttributeWithPath, AttributePath, INTERACTION_PROTOCOL_ID, attributePathToId } from "./InteractionServer";
import { Time, Timer } from "../../time/Time";
import { NodeId } from "../common/NodeId";
import { TlvSchema } from "@project-chip/matter.js";

interface PathValueVersion<T> {
    path: AttributePath,
    schema: TlvSchema<T>,
    valueVersion: { value: T, version: number },
}

export class SubscriptionHandler {
    private lastUpdateTimeMs = 0;
    private updateTimer: Timer | null = null;
    private outstandingAttributeUpdates = new Map<string, PathValueVersion<any>>();

    private attributeListeners = new Map<string, (value: any, version: number) => void>();

    constructor(
        readonly subscriptionId: number,
        private readonly server: MatterDevice,
        private readonly fabric: Fabric,
        private readonly peerNodeId: NodeId,
        private readonly attributes: AttributeWithPath[],
        private readonly minIntervalFloorMs: number,
        private readonly maxIntervalCeilingMs: number,
    ) {
        attributes.forEach(({ path, attribute }) => {
            const listener = (value: any, version: number) => this.attributeChangeListener(path, attribute.schema, version, value);
            this.attributeListeners.set(attributePathToId(path), listener);
            attribute.addMatterListener(listener);
        });
    }

    async sendUpdate() {
        const now = Date.now();
        if (this.updateTimer) {
            this.updateTimer.stop();
            this.updateTimer = null;
        }
        const timeSinceLastUpdateMs = now - this.lastUpdateTimeMs;
        if (timeSinceLastUpdateMs < this.minIntervalFloorMs) {
            console.log(` Too soon, waiting ${this.minIntervalFloorMs - timeSinceLastUpdateMs}ms`);
            this.updateTimer = Time.getTimer(this.minIntervalFloorMs - timeSinceLastUpdateMs, () => this.sendUpdate()).start();
            return;
        }

        const updatesToSend = Array.from(this.outstandingAttributeUpdates.values());
        this.outstandingAttributeUpdates.clear();
        this.lastUpdateTimeMs = now;
        await this.sendUpdateMessage(updatesToSend);

        this.updateTimer = Time.getTimer(this.maxIntervalCeilingMs, () => this.sendUpdate()).start();
    }

    async sendInitialReport(messenger: InteractionServerMessenger) {
        if (this.updateTimer) {
            this.updateTimer.stop();
            this.updateTimer = null;
        }

        const values = this.attributes.map(({ path, attribute }) => ({ path, schema: attribute.schema, valueVersion: attribute.getWithVersion() })).filter(({ valueVersion: { value } }) => value !== undefined) as PathValueVersion<any>[];
        await messenger.sendDataReport({
            suppressResponse: false,
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

        this.updateTimer = Time.getTimer(this.maxIntervalCeilingMs, () => this.sendUpdate()).start();
    }

    async attributeChangeListener(path: AttributePath, schema: TlvSchema<any>, version: number, value: any) {
        console.log(`Attribute change listener for subscription ${this.subscriptionId}`, path, version, value);
        this.outstandingAttributeUpdates.set(attributePathToId(path), { path, schema, valueVersion: { version, value } });
        await this.sendUpdate();
    }

    cancel() {
        this.attributes.forEach(({ path, attribute }) => {
            const pathId = attributePathToId(path);
            attribute.removeMatterListener(this.attributeListeners.get(pathId)!);
            this.attributeListeners.delete(pathId);
        });
        if (this.updateTimer) {
            this.updateTimer.stop();
        }
    }

    private async sendUpdateMessage(values: PathValueVersion<any>[]) {
        const exchange = this.server.initiateExchange(this.fabric, this.peerNodeId, INTERACTION_PROTOCOL_ID);
        if (exchange === undefined) return;
        const messenger = new InteractionServerMessenger(exchange);
        await messenger.sendDataReport({
            suppressResponse: !values.length, // suppressResponse ok for empty DataReports
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

        // Only expect answer for non-empty data reports
        if (values.length) {
            await messenger.waitForSuccess();
        }
        messenger.close();
    }
}
