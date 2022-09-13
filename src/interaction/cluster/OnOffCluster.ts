/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cluster } from "../model/Cluster";
import { BooleanT } from "../../codec/TlvObjectCodec";
import { NoArgumentsT, NoResponseT } from "../model/Command";

const CLUSTER_ID = 0x06;

export class OnOffCluster extends Cluster {
    static Builder = (onCallback?: (() => void) | undefined, offCallback?: (() => void) | undefined) => (endpointId: number) => new OnOffCluster(endpointId, onCallback, offCallback);

    private readonly onOffAttribute;

    constructor(
        endpointId: number,
        private readonly onCallback: (() => void) | undefined,
        private readonly offCallback: (() => void) | undefined,
    ) {
        super(
            endpointId,
            0x06,
            "On/Off",
        );

        this.addCommand(0, 0, "Off", NoArgumentsT, NoResponseT, () => this.setOnOff(false)),
        this.addCommand(1, 1, "On", NoArgumentsT, NoResponseT, () => this.setOnOff(true)),
        this.addCommand(2, 2, "Toggle", NoArgumentsT, NoResponseT, () => this.setOnOff(!this.onOffAttribute.get())),

        this.onOffAttribute = this.addAttribute(0, "OnOff", BooleanT, false);
    }

    private setOnOff(value: boolean) {
        const currentValue = this.onOffAttribute.get();
        if (value === currentValue) return;
        if (value && this.onCallback !== undefined) this.onCallback();
        if (!value && this.offCallback !== undefined) this.offCallback();
        this.onOffAttribute.set(value);
    }
}
