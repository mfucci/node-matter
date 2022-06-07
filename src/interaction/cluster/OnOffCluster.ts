/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Cluster } from "../model/Cluster";
import { Attribute } from "../model/Attribute";
import { BooleanT } from "../../codec/TlvObjectCodec";
import { Command, NoArgumentsT, NoResponseT } from "../model/Command";

export class OnOffCluster extends Cluster {
    private onOffAttribute = new Attribute(0, "OnOff", BooleanT, false);

    constructor(
        private readonly onCallback: (() => void) | undefined = undefined,
        private readonly offCallback: (() => void) | undefined = undefined,
    ) {
        super(
            0x06,
            "On/Off",
            [
                new Command(0, 0, "Off", NoArgumentsT, NoResponseT, () => this.setOnOff(false)),
                new Command(1, 1, "On", NoArgumentsT, NoResponseT, () => this.setOnOff(true)),
                new Command(2, 2, "Toggle", NoArgumentsT, NoResponseT, () => this.setOnOff(!this.onOffAttribute.get())),
            ],
        );
        this.addAttributes([
            this.onOffAttribute,
        ]);
    }

    private setOnOff(value: boolean) {
        const currentValue = this.onOffAttribute.get();
        if (value === currentValue) return;
        if (value && this.onCallback !== undefined) this.onCallback();
        if (!value && this.offCallback !== undefined) this.offCallback();
        this.onOffAttribute.set(value);
    }
}
