/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Element } from "../../codec/TlvCodec";
import { Template, TlvObjectCodec } from "../../codec/TlvObjectCodec";
import { SubscriptionHandler } from "../interaction/InteractionProtocol";

export interface Report {
    path: {
        endpointId: number,
        clusterId: number,
        attributeId: number,
    },
    version: number,
    value: Element | undefined,
}

export class Attribute<T> {
    private value: T;
    private version = 0;
    private readonly subscriptionsMap = new Map<number, SubscriptionHandler>();

    constructor(
        readonly endpointId: number,
        readonly clusterId: number,
        readonly id: number,
        readonly name: string,
        private readonly template: Template<T>,
        defaultValue: T,
    ) {
        this.value = defaultValue;
    }

    set(value: T) {
        this.version++;
        this.value = value;

        if (this.subscriptionsMap.size !== 0) {
            const report = this.getValue();
            [...this.subscriptionsMap.values()].forEach(subscription => subscription.sendReport(report))
        } 
    }

    get(): T {
        return this.value;
    }

    getValue(): Report {
        return {
            path: {
                endpointId: this.endpointId,
                clusterId: this.clusterId,
                attributeId: this.id,
            },
            version: this.version,
            value: TlvObjectCodec.encodeElement(this.value, this.template),
        }
    }

    addSubscription(subscription: SubscriptionHandler) {
        this.subscriptionsMap.set(subscription.subscriptionId, subscription);
    }

    removeSubscription(subscriptionId: number) {
        this.subscriptionsMap.delete(subscriptionId);
    }
}
