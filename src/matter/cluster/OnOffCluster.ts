/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bit,
    BooleanT,
    EnumT,
    Field,
    ObjectT,
    Template,
    UInt8T,
    Bound, BitMapT,
} from "../../codec/TlvObjectCodec";
import {
    Attribute,
    Cluster,
    Command,
    NoArgumentsT,
    NoResponseT,
} from "./Cluster";
import { MatterApplicationClusterSpecificationV1_0 } from "../../Specifications";

/**
 * Defined how the devices should behave when it is powered on.
 * If the value is null, the OnOff attribute is set to its previous value when the device starts up.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.5.1
 */
export const enum StartUpOnOff {
    /** Set the OnOff attribute to FALSE when the device starts up. */
    Off = 0,
    /** Set the OnOff attribute to TRUE when the device starts up. */
    On = 1,
    /**
     * If the previous value of the OnOff attribute is equal to FALSE, set the OnOff
     * attribute to TRUE. If the previous value of the OnOff attribute is equal to TRUE,
     * set the OnOff attribute to FALSE (toggle).
     */
    Toggle = 2,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4.1 */
export const enum EffectIdentifier {
    DelayedAllOff = 0,
    DyingLight = 1,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4.2 */
export const enum DelayedAllOffEffectVariant {
    /** Fade to off in 0.8 seconds. */
    Fade = 0,
    NoFade = 1,
    /** 50% dim down in 0.8 seconds then fade to off in 12 seconds. */
    DimDownThenFade = 2,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4.2 */
export const enum DyingLightEffectVariant {
    /** 20% dim up in 0.5s then fade to off in 1 second. */
    DimUpThenFade = 0,
}

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4.2 */
const EffectVariantT = UInt8T as Template<DyingLightEffectVariant | DelayedAllOffEffectVariant>;

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4 */
const OffWithEffectRequestT = ObjectT({
    effectIdentifier: Field(0, EnumT<EffectIdentifier>()),
    effectVariant: Field(1, EffectVariantT),
}) as Template<
    { effectIdentifier: EffectIdentifier.DelayedAllOff, effectVariant: DelayedAllOffEffectVariant } |
    { effectIdentifier: EffectIdentifier.DyingLight, effectVariant: DyingLightEffectVariant }
    >;

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4.2 */
const OnOffControlBitmapT = BitMapT({
    acceptOnlyWhenOn: Bit(1),
})

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.6. */
const OnWithTimedOffRequestT = ObjectT({
    onOffControl: Field(0, OnOffControlBitmapT),
    onTime: Field(1, Bound(UInt8T, { min: 0, max: 254 })), /* nullable: true */
    offWaitTime: Field(2, Bound(UInt8T, { min: 0, max: 254 })), /* nullable: true */
});

/**
 * Attributes and commands for switching devices between 'On' and 'Off' states.
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5
 */
export const OnOffCluster = Cluster({
    id: 0x06,
    name: "On/Off",
    revision: 4,
    features: {
        /** Level Control for Lighting - Behavior that supports lighting applications */
        lightingLevelControl: Bit(0),
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.6 */
    attributes: {
        /** Indicates whether the device type implemented on the endpoint is turned off (false) or turned on (true). */
        onOff: Attribute(0, BooleanT, { default: false }), /* reportable: true, scene:true */

        // The following attributes are only needed for "Level Control for Lighting" support

        /** Used to remember if a state is already storednin an old scene to not store one again when sending another Off command */
        //globalSceneControl: OptionalAttribute(0x4000, BooleanT, { default: true }),
        /**
         * Specifies the length of time (in 1/10ths second) that the ‘On’ state SHALL be maintained before
         * automatically transitioning to the ‘Off’ state when using the OnWithTimedOff command.
         */
        //onTime: OptionalWritableAttribute(0x4001, UInt16T, { default: 0 }), /* nullable: true, unit: 1/10s */
        /**
         * Specifies the length of time (in 1/10ths second) that the ‘Off’ state SHALL be guarded to prevent
         * another OnWithTimedOff command turning the server back to its ‘On’ state
         */
        //offWaitTime: OptionalWritableAttribute(0x4002, UInt16T, { default: 0 }), /* nullable: true, unit: 1/10s */
        /** Defines the desired startup behavior of a device when it is supplied with power. */
        //startUpOnOff: OptionalWritableAttribute(0x4003, EnumT<StartUpOnOff>(), { writeAcl: AccessLevel.Manage }), /* nullable: true */
    },

    /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7 */
    commands: {
        /**
         * On receipt of this command, a device SHALL enter its ‘Off’ state. This state is device dependent, but it is
         * recommended that it is used for power off or similar functions. On receipt of the Off command, the OnTime
         * attribute SHALL be set to 0.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.1
         */
        off: Command(0, NoArgumentsT, 0, NoResponseT),
        /**
         * On receipt of this command, a device SHALL enter its ‘On’ state. This state is device dependent, but it is
         * recommended that it is used for power on or similar functions. On receipt of the On command, if the value
         * of the OnTime attribute is equal to 0, the device SHALL set the OffWaitTime attribute to 0.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.2
         */
        on: Command(1, NoArgumentsT, 1, NoResponseT),
        /**
         * On receipt of this command, if a device is in its ‘Off’ state it SHALL enter its ‘On’ state. Otherwise,
         * if it is in its ‘On’ state it SHALL enter its ‘Off’ state. On receipt of the Toggle command, if the value
         * of the OnOff attribute is equal to FALSE and if the value of the OnTime attribute is equal to 0, the device
         * SHALL set the OffWaitTime attribute to 0. If the value of the OnOff attribute is equal to TRUE, the OnTime
         * attribute SHALL be set to 0.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.3
         */
        toggle: Command(2, NoArgumentsT, 2, NoResponseT),

        // The following attributes are only needed for "Level Control for Lighting" support
        // So we declare them option for now!
        // TODO: Split these out into a separate Cluster Spec that adds "Level Control for Lighting" support

        /**
         * The OffWithEffect command allows devices to be turned off using enhanced ways of fading.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.4
         */
        //offWithEffect: OptionalCommand(0x40, OffWithEffectRequestT, 0x40, NoResponseT), /* optional: true */
        /**
         * The OnWithRecallGlobalScene command allows the recall of the settings when the device was turned off.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.5
         */
        //onWithRecallGlobalScene: OptionalCommand(0x41, NoArgumentsT, 0x41, NoResponseT), /* optional: true */
        /**
         * The OnWithTimedOff command allows devices to be turned on for a specific duration with a guarded off
         * duration so that SHOULD the device be subsequently switched off, further OnWithTimedOff commands, received
         * during this time, are prevented from turning the devices back on.
         *
         * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.5.7.6
         */
        //onWithTimedOff: OptionalCommand(0x42, OnWithTimedOffRequestT, 0x42, NoResponseT), /* optional: true */
    },
});
