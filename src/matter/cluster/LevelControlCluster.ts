/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptionalAttribute, WritableAttribute, OptionalWritableAttribute, Attribute, Cluster, Command, OptionalCommand, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvEnum, TlvField, TlvNullable, TlvObject, TlvUInt16, TlvUInt8 } from "@project-chip/matter.js";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.5.8 */
const optionsBitmap = TlvBitmap(TlvUInt8, {
    /** Dependency on On/Off cluster. */
    executeIfOff: BitFlag(0), // TODO default: true.

    /** Level effect on color. */
    coupleColorTempToLevel: BitFlag(1),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.1 */
const MoveToLevelCommandRequest = TlvObject({
    level: TlvField(0, TlvUInt8.bound({max:254})),
    transitionTime: TlvField(1, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(2, optionsBitmap),
    optionsOverride: TlvField(3, optionsBitmap), // TODO: 0 Default - all optionsOverride
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.2 */
const MoveCommandRequest = TlvObject({
    moveMode: TlvField(0, TlvEnum<MoveMode>()),
    rate: TlvField(1, TlvNullable(TlvUInt8)),
    optionsMask: TlvField(2, optionsBitmap),
    optionsOverride: TlvField(3, optionsBitmap),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.3 */
const StepCommandRequest = TlvObject({
    stepMode: TlvField(0, TlvEnum<StepMode>()),
    stepSize: TlvField(1, TlvUInt8),
    transitionTime: TlvField(2, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(3, optionsBitmap),
    optionsOverride: TlvField(4, optionsBitmap),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.4 */
const StopCommandRequest = TlvObject({
    optionsMask: TlvField(0, optionsBitmap),
    optionsOverride: TlvField(1, optionsBitmap),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.5  */
const MoveToClosestFrequencyCommandRequest = TlvObject({
    frequency: TlvField(0, TlvUInt16), // TODO - Default 0, how to set TlvField default?
})

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.4 */
const features = {
    /** Dependency with the On/Off cluster */
    onOffClusterDependency: BitFlag(0), // TODO default: true.

    /** Behavior that supports lighting applications. */
    lighting: BitFlag(1),

    /** Supports frequency attributes and behavior. */
    supportFrequency: BitFlag(2)
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6.2.1 */
const enum MoveMode {
    Up = 0x0,
    Down = 0x1,
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6.3 */
const enum StepMode {
    Up = 0x0,
    Down = 0x1,
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.5 */
const attributes = {
    /** Current level of this device. */
    currentLevel: Attribute(0x0, TlvNullable(TlvUInt8), {default: null}), 

    /** Time until the current command is complete in 1/10ths of sec. */
    remainingTime: OptionalAttribute(0x01, TlvUInt16, {default: 0}),

    /** Minimum value of {@link attributes.currentLevel}. */
    minLevel: OptionalAttribute(0x02, TlvUInt8),

    /** Maximum value of {@link attributes.currentLevel}. */
    maxLevel: Attribute(0x03, TlvUInt8.bound({max: 254}), {default: 254}),

    /** Frequency at which the device is at CurrentLevel. */
    currentFrequency: OptionalAttribute(0x04, TlvUInt16, {default: 0}),

    /** Min value of CurrentFrequency capable of being assigned. */
    minFrequency: OptionalAttribute(0x05, TlvUInt16, {default: 0}),

    /** Max value of CurrentFrequency capable of being assigned. */
    maxFrequency: OptionalAttribute(0x06, TlvUInt16, {default: 0}),

    /** Time to move to/from the target when On/Off received by On/Off cluster on the same endpoint. */
    onOffTransitionTime: OptionalWritableAttribute(0x10, TlvUInt16, {default: 0}),

    /** CurrentLevel when OnOff attr of On/Off cluster on the same endpoint is TRUE. */
    onLevel: WritableAttribute(0x11, TlvNullable(TlvUInt8), {default: null}),

    /** Time taken to move the current level from the min level to the max level. */
    onTransitionTime: OptionalWritableAttribute(0x12, TlvNullable(TlvUInt16,), {default: null}),

    /** Time taken to move the current level from the max level to the minlevel. */
    offTransitionTime: OptionalWritableAttribute(0x13, TlvNullable(TlvUInt16), {default: null}),

    /** Default rate in units per second when a Move command has a null rate. */
    defaultMoveRate: OptionalWritableAttribute(0x14, TlvNullable(TlvUInt8)),

    /** Determines the default behavior of some cluster commands. */
    options: Attribute(0x0f, optionsBitmap),

    /** Desired startup level for a device when it is supplied with power. */
    startUpCurrentLevel: OptionalWritableAttribute(0x4000, TlvNullable(TlvUInt8)),  
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6 */
const commands = {
    
    /** Moves from the current level to the specified level.*/
    moveToLevel: Command(0x0, MoveToLevelCommandRequest, 0x0, TlvNoResponse),
    
    /** Moves from the current level up or down in a continuous fashion. */
    move: Command(0x1, MoveCommandRequest, 0x1, TlvNoResponse),

    /** Moves from the current level up or down in a stepwise fashion. */
    step: Command(0x2, StepCommandRequest, 0x2, TlvNoResponse),

    /** Stops moving the current level. */
    stop: Command(0x3, StopCommandRequest, 0x3, TlvNoResponse),

    /** Same as {@link commands.moveToLevel}, but change the status of OnOff device on same endpoint. */
    moveToLevelWithOnOff: Command( 0x4, MoveToLevelCommandRequest, 0x4, TlvNoResponse),

     /** Same as {@link commands.move}, but change the status of OnOff device on same endpoint. */
    moveWithOnOff: Command(0x5, MoveCommandRequest, 0x5,TlvNoResponse),    
    
    /** Same as {@link commands.step}, but change the status of OnOff device on same endpoint. */
    stepWithOnOff: Command(0x6, StepCommandRequest, 0x6, TlvNoResponse),

    /** Same as {@link commands.stop}, but change the status of OnOff device on same endpoint. */
    stopWithOnOff: Command(0x7, StopCommandRequest, 0x7, TlvNoResponse),

    /** Changes current frequency to the requested frequency, or to the closest frequency. */
    moveToClosestFrequency: OptionalCommand(0x8, MoveToClosestFrequencyCommandRequest, 0x8, TlvNoResponse),
};

/**
 * Attributes and commands for changing the level of devices, e.g. light intensity
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6
 */
export const LevelControlCluster = Cluster({
    id: 0x08,
    name: "LevelControl",
    revision: 5,
    features,
    attributes,
    commands,
 });

 /**
 * Attributes and commands for Pulse Width Modulation (Provisional)
 *
 * @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.3
 */
 export const PulseWidthModulationLevelControlCluster = Cluster({
    id: 0x001c, 
    name: "PulseWidthModulation",
    revision: 5,
    features,
    attributes,
    commands,
 });