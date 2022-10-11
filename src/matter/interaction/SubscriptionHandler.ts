/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatterDevice } from "../MatterDevice";
import { InteractionServerMessenger } from "./InteractionMessenger";
import { TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { Element } from "../../codec/TlvCodec";
import { Attribute } from "../cluster/server/Attribute";
import { Fabric } from "../fabric/Fabric";
import { AttributeWithPath, Path, INTERACTION_PROTOCOL_ID } from "./InteractionServer";


export class SubscriptionHandler {

    static Builder = (server: MatterDevice, fabric: Fabric, peerNodeId: bigint, attributes: AttributeWithPath[]) => (subscriptionId: number) => new SubscriptionHandler(subscriptionId, server, fabric, peerNodeId, attributes);

    constructor(
        readonly subscriptionId: number,
        private readonly server: MatterDevice,
        private readonly fabric: Fabric,
        private readonly peerNodeId: bigint,
        private readonly attributes: AttributeWithPath[]
    ) {
        // TODO: implement minIntervalFloorSeconds and maxIntervalCeilingSeconds
        attributes.forEach(({ path, attribute }) => attribute.addListener(subscriptionId, () => this.sendUpdate(path, attribute)));
        this.sendUpdateAll();
    }

    async sendUpdate(path: Path, attribute: Attribute<any>) {
        const exchange = this.server.initiateExchange(this.fabric, this.peerNodeId, INTERACTION_PROTOCOL_ID);
        if (exchange === undefined)
            return;
        const { value, version } = attribute.getWithVersion();
        const messenger = new InteractionServerMessenger(exchange);
        await messenger.sendDataReport({
            subscriptionId: this.subscriptionId,
            interactionModelRevision: 1,
            values: [{
                value: {
                    path,
                    version,
                    value: TlvObjectCodec.encodeElement(value, attribute.template) as Element,
                },
            }],
        });
        await messenger.waitForSuccess();
        messenger.close();
    }

    async sendUpdateAll() {
        const exchange = this.server.initiateExchange(this.fabric, this.peerNodeId, INTERACTION_PROTOCOL_ID);
        if (exchange === undefined)
            return;
        const values = this.attributes.map(({ attribute, path }) => ({ path, valueVersion: attribute.getWithVersion(), template: attribute.template }));
        const messenger = new InteractionServerMessenger(exchange);
        console.log("Sending updates");
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
        console.log("Waiting for success");
        await messenger.waitForSuccess();
        console.log("Success received");
        messenger.close();
    }

    cancel() {
        this.attributes.forEach(({ attribute }) => attribute.removeListener(this.subscriptionId));
    }
}
