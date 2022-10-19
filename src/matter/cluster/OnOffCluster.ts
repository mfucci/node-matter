/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, Field, ObjectT, StringT, Template, UnsignedIntT, UnsignedLongT } from "../../codec/TlvObjectCodec";
import { Attribute, OptionalAttribute, OptionalWritableAttribute, Cluster, Command, NoArgumentsT, NoResponseT } from "./Cluster";
import { TlvType } from "../../codec/TlvCodec";

export const enum OnOffStartUpOnOff {
    Off = 0,
    On = 1,
    Toggle = 2,
}
const OnOffStartUpOnOffT = { tlvType: TlvType.UnsignedInt } as Template<OnOffStartUpOnOff>;

export const enum OnOffEffectIdentifier {
    DelayedAllOff = 0,
    DyingLight = 1,
}
const OnOffEffectIdentifierT = { tlvType: TlvType.UnsignedInt } as Template<OnOffEffectIdentifier>;

export const enum OnOffDelayedAllOffEffectVariant {
    FadeToOffIn_0p8Seconds = 0,
    NoFade = 1,
    "50PercentDimDownIn_0p8SecondsThenFadeToOffIn_12Seconds" = 2,
}
const OnOffDelayedAllOffEffectVariantT = { tlvType: TlvType.UnsignedInt } as Template<OnOffDelayedAllOffEffectVariant>;

export const enum OnOffDyingLightEffectVariant {
    "20PercentDimUpIn_0p5SecondsThenFadeToOffIn_1Second" = 0,
}
const OnOffDyingLightEffectVariantT = { tlvType: TlvType.UnsignedInt } as Template<OnOffDyingLightEffectVariant>;

/*
  <bitmap name="OnOffControl" type="BITMAP8">
    <cluster code="0x0006"/>
    <field name="AcceptOnlyWhenOn" mask="0x01"/>
  </bitmap>
*/

const OffWithEffectRequestT = ObjectT({
    effectId: Field(0, OnOffEffectIdentifierT),
    effectVariant: Field(1, OnOffDelayedAllOffEffectVariantT), /* OR OnOffDyingLightEffectVariantT depending on first field */
});

const OnWithTimedOffRequestT = ObjectT({
    onOffControl: Field(0, UnsignedIntT), /* TODO: Type is a Bit map! */
    onTime: Field(1, UnsignedIntT), /* min:0, max: 254 */
    offWaitTime: Field(2, UnsignedIntT), /* min:0, max: 254 */
});

/**
 * Attributes and commands for switching devices between 'On' and 'Off' states.
 */
export const OnOffCluster = Cluster(
    0x06,
    "On/Off",
    {
        onOff: Attribute(0, BooleanT, false), /* reportable: true */
        globalSceneControl: OptionalAttribute(0x4000, BooleanT, true),
        onTime: OptionalWritableAttribute(0x4001, UnsignedIntT, 0),
        offWaitTime: OptionalWritableAttribute(0x4002, UnsignedIntT, 0),
        startUpOnOff: OptionalWritableAttribute(0x4003, OnOffStartUpOnOffT), /* nullable: true, writeAcl: manage */
    },
    {
        /**
         * On receipt of this command, a device SHALL enter its ‘Off’ state. This state is device dependent, but it is
         * recommended that it is used for power off or similar functions. On receipt of the Off command, the OnTime
         * attribute SHALL be set to 0.
         */
        off: Command(0, NoArgumentsT, 0, NoResponseT),
        /**
         * On receipt of this command, a device SHALL enter its ‘On’ state. This state is device dependent, but it is
         * recommended that it is used for power on or similar functions. On receipt of the On command, if the value
         * of the OnTime attribute is equal to 0, the device SHALL set the OffWaitTime attribute to 0.
         */
        on: Command(1, NoArgumentsT, 1, NoResponseT),
        /**
         * On receipt of this command, if a device is in its ‘Off’ state it SHALL enter its ‘On’ state. Otherwise,
         * if it is in its ‘On’ state it SHALL enter its ‘Off’ state. On receipt of the Toggle command, if the value
         * of the OnOff attribute is equal to FALSE and if the value of the OnTime attribute is equal to 0, the device
         * SHALL set the OffWaitTime attribute to 0. If the value of the OnOff attribute is equal to TRUE, the OnTime
         * attribute SHALL be set to 0.
         */
        toggle: Command(2, NoArgumentsT, 2, NoResponseT),
        /**
         * The OffWithEffect command allows devices to be turned off using enhanced ways of fading.
         */
        offWithEffect: Command(0x40, OffWithEffectRequestT, 0x40, NoResponseT), /* optional: true */
        /**
         * The OnWithRecallGlobalScene command allows the recall of the settings when the device was turned off.
         */
        onWithRecallGlobalScene: Command(0x41, NoArgumentsT, 0x41, NoResponseT), /* optional: true */
        /**
         * The OnWithTimedOff command allows devices to be turned on for a specific duration with a guarded off
         * duration so that SHOULD the device be subsequently switched off, further OnWithTimedOff commands, received
         * during this time, are prevented from turning the devices back on.
         */
        onWithTimedOff: Command(0x42, OnWithTimedOffRequestT, 0x42, NoResponseT), /* optional: true */
    },
);

/*
Features:
  <bitmap name="OnOffFeature" type="BITMAP32">
    <cluster code="0x0006" />
    <field name="Lighting" mask="0x01" />
  </bitmap>

 */
