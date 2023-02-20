/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptionalAttribute, WritableAttribute, OptionalWritableAttribute, Attribute, Cluster, OptionalCommand, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvBitmap, TlvEnum, TlvField, TlvNullable, TlvObject, TlvUInt16, TlvUInt8 } from "@project-chip/matter.js";

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.5.8 */
export const OptionsBitmap = {
    /** Command execution control - see 1.6.5.8.1. */
    ExecuteIfOff: BitFlag(0), // TODO default: true.

    /** level effect on color - see 1.6.5.8.2 */
    CoupleColorTempToLevel: BitFlag(1),
};

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.1 */
const  MoveToLevelCommand = TlvObject({
    level: TlvField(0, TlvUInt8.bound({min:0, max:254})),
    transitionTime: TlvField(1, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(2, TlvBitmap(TlvUInt8, OptionsBitmap)),
    optionsOverride: TlvField(3, TlvBitmap(TlvUInt8, OptionsBitmap)), // TODO: 0 Default - all optionsOverride
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.2 */
const  MoveCommand = TlvObject({
    moveMode: TlvField(0, TlvEnum<MoveMode>()),
    rate: TlvField(1, TlvNullable(TlvUInt8)),
    optionsMask: TlvField(2, TlvBitmap(TlvUInt8, OptionsBitmap)),
    optionsOverride: TlvField(3, TlvBitmap(TlvUInt8, OptionsBitmap)),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.3 */
const  StepCommand = TlvObject({
    stepMode: TlvField(0, TlvEnum<StepMode>()),
    stepSize: TlvField(1, TlvUInt8),
    transitionTime: TlvField(2, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(3, TlvBitmap(TlvUInt8, OptionsBitmap)),
    optionsOverride: TlvField(4, TlvBitmap(TlvUInt8, OptionsBitmap)),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.4 */
const  StopCommand = TlvObject({
    optionsMask: TlvField(0, TlvBitmap(TlvUInt8, OptionsBitmap)),
    optionsOverride: TlvField(1, TlvBitmap(TlvUInt8, OptionsBitmap)),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.5  */
const MoveToClosestFrequencyCommand = TlvObject({
    frequency: TlvField(0, TlvUInt16 ), // FIXME - Default 0, how to set TlvField default?
})

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.4 */
const features = {
    /** Dependency with the On/Off cluster */
    OnOff: BitFlag(0), // TODO default: true.

    /** Behavior that supports lighting applications */
    Lighting: BitFlag(1),

    /** Supports frequency attributes and behavior. */
    Frequency: BitFlag(2)
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6.2.1 */
const enum MoveMode {
    up = 0x0,
    down = 0x1,
};
/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6.3 */
const enum StepMode {
    up = 0x0,
    down = 0x1,
};

 /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.5 */
const attributes = {
    /** the current level of this device */
    currentLevel: Attribute(0x0,  TlvNullable(TlvUInt8), {default: null}), 

    /** time until the current command is complete in 1/10ths of sec */
    remainingTime: OptionalAttribute(0x01, TlvUInt16, {default: 0}),

    /** the minimum value of CurrentLevel  */
    minLevel: OptionalAttribute(0x02, TlvUInt8.bound({ min: 0})),

    /** the maximum value of CurrentLevel */
    maxLevel: Attribute(0x03, TlvUInt8.bound({ max: 254}), {default: 254}),

    /** the frequency at which the device is at CurrentLevel */
    currentFrequency: OptionalAttribute(0x04, TlvUInt16, {default: 0}),

    /** min value of CurrentFrequency capable of being assigned */
    minFrequency: OptionalAttribute(0x05, TlvUInt16.bound({min: 0}), {default: 0}),

    /** max value of CurrentFrequency capable of being assigned */
    maxFrequency: OptionalAttribute(0x06, TlvUInt16, {default: 0}),

    /** time to move to/from the target when On/Off received by On/Off cluster on the same endpoint */
    onOffTransitionTime: OptionalAttribute(0x10, TlvUInt16, {default: 0}),

    /** CurrentLevel when OnOff attr of On/Off cluster on the same endpoint is TRUE */
    onLevel: WritableAttribute(0x11,  TlvNullable(TlvUInt8), {default: null}),

    /** time taken to move the current level from the min level to the max level */
    onTransitionTime: OptionalWritableAttribute(0x12, TlvNullable(TlvUInt16,), {default: null}),

    /** time taken to move the current level from the max level to the minlevel  */
    offTransitionTime: OptionalWritableAttribute(0x13, TlvNullable(TlvUInt16), {default: null}),

    /** default rate in units per second when a Move command has a null Rate */
    defaultMoveRate: OptionalWritableAttribute(0x14, TlvNullable(TlvUInt8)),

    options: Attribute(0x0f,  TlvBitmap(TlvUInt8, OptionsBitmap) ),

    startUpCurrentLevel: OptionalAttribute(0x4000, TlvNullable(TlvUInt8),),  
};

/* TODO - Implement all below and change from Optional to Mandatory */

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6 */
const commands = {
    /** Move from the current level to the specified level */
    moveToLevel: OptionalCommand(0x0, MoveToLevelCommand, 0x0, TlvNoResponse),
    
    /** move from the current level up or down in a continuous fashion */
    move: OptionalCommand(0x1, MoveCommand, 0x1, TlvNoResponse),

    /** move from the current level up or down in a stepwise fashion */
    step: OptionalCommand(0x2, StepCommand, 0x2, TlvNoResponse),

    /** stop moving the current level */
    stop: OptionalCommand(0x3, StopCommand, 0x3, TlvNoResponse),

    /** same as moveToLevel, but change the on/off status of OnOff device on same endpoint */
    moveToLevelWithOnOff: OptionalCommand( 0x4, MoveToLevelCommand, 0x4, TlvNoResponse ),

     /** same as move, but change the on/off status of OnOff device on same endpoint */
    moveWithOnOff: OptionalCommand(0x5, MoveCommand, 0x5,TlvNoResponse),    
    
    /** same as step, but change the on/off status of OnOff device on same endpoint */
    stepWithOnOff: OptionalCommand(0x6, StepCommand, 0x6, TlvNoResponse),

    /** same as stop, but change the on/off status of OnOff device on same endpoint */
    stopWithOnOff: OptionalCommand(0x7, StopCommand, 0x7, TlvNoResponse),

    /** change current frequency to the requested frequency, or to the closest frequency */
    moveToClosestFrequency: OptionalCommand(0x8, MoveToClosestFrequencyCommand, 0x8, TlvNoResponse),
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
 * Attributes and commands for Pulse Width Moduation (Provisional)
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
