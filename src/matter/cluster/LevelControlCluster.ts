/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OptionalAttribute, Attribute, Cluster, OptionalCommand, TlvNoResponse } from "./Cluster";
import { BitFlag, MatterApplicationClusterSpecificationV1_0, TlvField, TlvNullable, TlvObject, TlvUInt16, TlvUInt8 } from "@project-chip/matter.js";

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.1 */
const  MoveToLevelCommand = TlvObject({
    level: TlvField(0, TlvUInt8),
    transitionTime: TlvField(1, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(2, TlvUInt8),
    optionsOverride: TlvField(3, TlvUInt8),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.2 */
const  MoveCommand = TlvObject({
    moveMode: TlvField(0, TlvUInt8),
    rate: TlvField(1, TlvNullable(TlvUInt8)),
    optionsMask: TlvField(2, TlvUInt8),
    optionsOverride: TlvField(3, TlvUInt8),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.3 */
const  StepCommand = TlvObject({
    stepMode: TlvField(0, TlvUInt8),
    stepSize: TlvField(1, TlvUInt8),
    transitionTime: TlvField(2, TlvNullable(TlvUInt16)),
    optionsMask: TlvField(3, TlvUInt8),
    optionsOverride: TlvField(4, TlvUInt8),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.4 */
const  StopCommand = TlvObject({
    optionsMask: TlvField(0, TlvUInt8),
    optionsOverride: TlvField(1, TlvUInt8),
});

/** @see {@link MatterCoreSpecificationV1_0} § 1.6.6.5  */
const MoveToClosestFrequencyCommand = TlvObject({
    frequency: TlvField(0,TlvUInt16),
})

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.4 */
const features = {
    /** Dependency with the On/Off cluster */
    OnOff: BitFlag(0),
    /** Behavior that supports lighting applications */
    Lighting: BitFlag(1),
    /** Supports frequency attributes and behavior. */
    Frequency: BitFlag(2)
};

 /** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.5 */
const attributes = {
    /** the current level of this device */
    currentLevel: Attribute(0x0,  TlvUInt8, {default: 0}), 

    /** time until the current command is complete in 1/10ths of sec */
    remainingTime: Attribute(0x01, TlvUInt16, {default: 0}),

    /** the minimum value of CurrentLevel  */
    minLevel: OptionalAttribute(0x02, TlvUInt8),

    /** the maximum value of CurrentLevel */
    maxLevel: OptionalAttribute(0x03, TlvUInt8, {default: 254}),

    /** the frequency at which the device is at CurrentLevel */
    currentFrequency: Attribute(0x04, TlvUInt16, {default: 0}),

    /** min value of CurrentFrequency capable of being assigned */
    minFrequency: Attribute(0x05, TlvUInt16, {default: 0}),

    /** max value of CurrentFrequency capable of being assigned */
    maxFrequency: Attribute(0x06, TlvUInt16, {default: 0}),

    /** time to move to/from the target when On/Off received by On/Off cluster on the same endpoint */
    onOffTransitionTime: OptionalAttribute(0x10, TlvUInt16, {default: 0}),

    /** CurrentLevel when OnOff attr of On/Off cluster on the same endpoint is TRUE */
    onLevel: Attribute(0x11,  TlvNullable(TlvUInt8)),

    /** time taken to move the current level from the min level to the max level */
    onTransitionTime: OptionalAttribute(0x12, TlvNullable(TlvUInt16,)),

    /** time taken to move the current level from the max level to the minlevel  */
    offTransitionTime: OptionalAttribute(0x13, TlvNullable(TlvUInt16),),

    /** default rate in units per second when a Move command has a null Rate */
    defaultMoveRate: OptionalAttribute(0x14, TlvNullable(TlvUInt8),),

    options: Attribute(0x0f,  TlvUInt8, {default: 0 }),
    startUpCurrentLevel: Attribute(0x4000, TlvNullable(TlvUInt8),),  
};

/** @see {@link MatterApplicationClusterSpecificationV1_0} § 1.6.6 */
const commands = {
    /** Move from the current level to the specified level */
    moveToLevel: OptionalCommand(0x0, MoveToLevelCommand, 0x0, TlvNoResponse), // FIXME - all need resposne?
    
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
 export const PulseWidthModulation = Cluster({
    id: 0x001c, 
    name: "PulseWidthModulation",
    revision: 5,
    features,
    attributes,
    commands,
 });
