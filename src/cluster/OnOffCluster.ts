import { Cluster } from "../model/Cluster";
import { Attribute } from "../model/Attribute";
import { BooleanT } from "../codec/TlvObjectCodec";
import { Command, NoArgumentsT, NoResponseT } from "../model/Command";

export class OnOffCluster extends Cluster {
    private onOffAttribute = new Attribute(0, "OnOff", BooleanT, false);

    constructor() {
        super(
            0x06,
            "On/Off",
            [
                new Command(0, 0, "Off", NoArgumentsT, NoResponseT, () => this.onOffAttribute.set(false)),
                new Command(1, 1, "On", NoArgumentsT, NoResponseT, () => this.onOffAttribute.set(true)),
                new Command(2, 2, "Toggle", NoArgumentsT, NoResponseT, () => this.onOffAttribute.set(!this.onOffAttribute.get())),
            ],
        );
        this.addAttributes([
            this.onOffAttribute,
        ]);
    }
}
