/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT, Field, ObjectT, StringT, Template, UnsignedIntT, UnsignedLongT } from "../../codec/TlvObjectCodec";
import { Attribute, OptionalAttribute, OptionalWritableAttribute, Cluster, Command, NoArgumentsT, NoResponseT } from "./Cluster";
import { TlvType } from "../../codec/TlvCodec";


// From [Matter Application Cluster Specification R1.0], section 1.5.5.1
// If the value is null, the OnOff attribute is set to its previous value when the device starts up.
export const enum StartUpOnOff {
    /**
     * Set the OnOff attribute to FALSE when the device starts up.
     */
    Off = 0,
    /**
     * Set the OnOff attribute to TRUE when the device starts up.
     */
    On = 1,
    /**
     * If the previous value of the OnOff attribute is equal to FALSE, set the OnOff
     * attribute to TRUE. If the previous value of the OnOff attribute is equal to TRUE,
     * set the OnOff attribute to FALSE (toggle).
     */
    Toggle = 2,
}
const StartUpOnOffT = { tlvType: TlvType.UnsignedInt } as Template<StartUpOnOff>;

// From [Matter Application Cluster Specification R1.0], section 1.5.7.4.1
export const enum EffectIdentifier {
    DelayedAllOff = 0,
    DyingLight = 1,
}
const EffectIdentifierT = { tlvType: TlvType.UnsignedInt } as Template<EffectIdentifier>;

// From [Matter Application Cluster Specification R1.0], section 1.5.7.4.2
export const enum DelayedAllOffEffectVariant {
    /**
     * Fade to off in 0.8 seconds
     */
    Fade = 0,
    NoFade = 1,
    /**
     * 50% dim down in 0.8 seconds then fade to off in 12 seconds
     */
    DimDownThenFade = 2,
}
const DelayedAllOffEffectVariantT = { tlvType: TlvType.UnsignedInt } as Template<DelayedAllOffEffectVariant>;

// From [Matter Application Cluster Specification R1.0], section 1.5.7.4.2
export const enum DyingLightEffectVariant {
    /**
     * 20% dim up in 0.5s then fade to off in 1 second
     */
    DimUpThenFade = 0,
}
const DyingLightEffectVariantT = { tlvType: TlvType.UnsignedInt } as Template<DyingLightEffectVariant>;

// From [Matter Application Cluster Specification R1.0], section 1.5.7.4.2
const EffectVariantT = UnsignedIntT as Template<DyingLightEffectVariant | DelayedAllOffEffectVariant>;

/*
// TODO Add Bitfield Type
  <bitmap name="OnOffControl" type="BITMAP8">
    <cluster code="0x0006"/>
    <field name="AcceptOnlyWhenOn" mask="0x01"/>
  </bitmap>
*/

const OffWithEffectRequestT = ObjectT({
    effectIdentifier: Field(0, EffectIdentifierT),
    effectVariant: Field(1, EffectVariantT),
}) as Template<
    { effectIdentifier: EffectIdentifier.DelayedAllOff, effectVariant: DelayedAllOffEffectVariant } |
    { effectIdentifier: EffectIdentifier.DyingLight, effectVariant: DyingLightEffectVariant }
    >;

const OnWithTimedOffRequestT = ObjectT({
    onOffControl: Field(0, UnsignedIntT), /* TODO: Type is a Bit map! */
    onTime: Field(1, UnsignedIntT), /* nullable: true, min:0, max: 254 */
    offWaitTime: Field(2, UnsignedIntT), /* nullable: true, min:0, max: 254 */
});

/*
  TODO
  * Feature map:
    * Bit 0: Level Control for Lighting - Behavior that supports lighting applications.
 */
/*
Features:
  <bitmap name="OnOffFeature" type="BITMAP32">
    <cluster code="0x0006" />
    <field name="Lighting" mask="0x01" />
  </bitmap>

 */


/**
 * From [Matter Application Cluster Specification R1.0], section 1.5
 * Attributes and commands for switching devices between 'On' and 'Off' states.
 */
export const OnOffCluster = Cluster(
    0x06,
    "On/Off",
    {
        onOff: Attribute(0, BooleanT, false), /* reportable: true, scene:true */
        globalSceneControl: OptionalAttribute(0x4000, BooleanT, true),
        onTime: OptionalWritableAttribute(0x4001, UnsignedIntT, 0), /* nullable: true, unit: 1/10s */
        offWaitTime: OptionalWritableAttribute(0x4002, UnsignedIntT, 0), /* nullable: true, unit: 1/10s */
        startUpOnOff: OptionalWritableAttribute(0x4003, StartUpOnOffT), /* nullable: true, writeAcl: manage */
    },
    {
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.1
         * On receipt of this command, a device SHALL enter its ‘Off’ state. This state is device dependent, but it is
         * recommended that it is used for power off or similar functions. On receipt of the Off command, the OnTime
         * attribute SHALL be set to 0.
         */
        off: Command(0, NoArgumentsT, 0, NoResponseT),
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.2
         * On receipt of this command, a device SHALL enter its ‘On’ state. This state is device dependent, but it is
         * recommended that it is used for power on or similar functions. On receipt of the On command, if the value
         * of the OnTime attribute is equal to 0, the device SHALL set the OffWaitTime attribute to 0.
         */
        on: Command(1, NoArgumentsT, 1, NoResponseT),
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.3
         * On receipt of this command, if a device is in its ‘Off’ state it SHALL enter its ‘On’ state. Otherwise,
         * if it is in its ‘On’ state it SHALL enter its ‘Off’ state. On receipt of the Toggle command, if the value
         * of the OnOff attribute is equal to FALSE and if the value of the OnTime attribute is equal to 0, the device
         * SHALL set the OffWaitTime attribute to 0. If the value of the OnOff attribute is equal to TRUE, the OnTime
         * attribute SHALL be set to 0.
         */
        toggle: Command(2, NoArgumentsT, 2, NoResponseT),
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.4
         * The OffWithEffect command allows devices to be turned off using enhanced ways of fading.
         */
        offWithEffect: Command(0x40, OffWithEffectRequestT, 0x40, NoResponseT), /* optional: true */
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.5
         * The OnWithRecallGlobalScene command allows the recall of the settings when the device was turned off.
         */
        onWithRecallGlobalScene: Command(0x41, NoArgumentsT, 0x41, NoResponseT), /* optional: true */
        /**
         * From [Matter Application Cluster Specification R1.0], section 1.5.7.6
         * The OnWithTimedOff command allows devices to be turned on for a specific duration with a guarded off
         * duration so that SHOULD the device be subsequently switched off, further OnWithTimedOff commands, received
         * during this time, are prevented from turning the devices back on.
         */
        onWithTimedOff: Command(0x42, OnWithTimedOffRequestT, 0x42, NoResponseT), /* optional: true */
    },
);
