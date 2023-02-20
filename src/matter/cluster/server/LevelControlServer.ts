/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelControlCluster } from "../LevelControlCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { UseOptionalAttributes } from "./ClusterServer";

// TODO: Create temporary options based on mask and override. How to expose to user of the library?

export const LevelControlClusterHandler: () => ClusterServerHandlers<typeof LevelControlCluster> = () => ({
    moveToLevel: async ({ request:{level, transitionTime, optionsMask, optionsOverride}, attributes: { currentLevel } }) => { 
      currentLevel.set(level);
    }, 

    // TODO: How much this capability should be in the library vs. in the caller of the library? Doing the
    // move/step/stop (withOnOff) in the library would be making assumptions about the capabilities of the 
    // underlying hardware. But how to expose these paramters to the caller of the library? Callback?
    move: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    step: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    stop: async ({ request:{optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    
    moveToLevelWithOnOff: async function ({ request: { level, optionsOverride }, attributes: { currentLevel} }) {
      
      /* TODO: Need to be able to access or check existance of optional attributes
      if ( level <= minLevel.get() && associated onOff device on){
         // turn associated onOff device off
      } else if associated onOff device off {
         // turn associated onOff device on
      }
      */

      currentLevel.set(level);
    },
    
    moveWithOnOff: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    stepWithOnOff: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    stopWithOnOff: async ({ request:{optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    moveToClosestFrequency: async ({request:{frequency, }, attributes: { /* currentFrequency */ } }) => { }, 
    // TODO: How to access or check existance of optional attribute?
    /* currentFrequency = frequency */
});
