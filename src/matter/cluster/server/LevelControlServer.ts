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
    moveToLevel: async ({ request:{level}, attributes: {currentLevel} }) => { 
      currentLevel.set(level);
    }, 

    // TODO: How much this capability should be in the library vs. in the caller of the library? Doing the
    // move/step/stop (withOnOff) in the library would be making assumptions about the capabilities of the 
    // underlying hardware. But how to expose these paramters to the caller of the library? Callback with
    // temporary options?
    move: async ({ request:{}, attributes: {} }) => {
      throw new Error("Not implementated")
    },
    step: async ({ request:{}, attributes: {} }) => {
      throw new Error("Not implementated")
    },
    stop: async ({ request:{}, attributes: {} }) => {
      throw new Error("Not implementated")
    },
    
    moveToLevelWithOnOff: async function ({ request: {level}, attributes: {currentLevel} }) {
      
      /* TODO: Need to be able to access or check existance of optional attributes
      if ( level <= minLevel.get() && associated onOff device on){
         // turn associated onOff device off
      } else if associated onOff device off {
         // turn associated onOff device on
      }
      */

      currentLevel.set(level);
    },
    
    moveWithOnOff: async ({ request:{}, attributes: { currentLevel } }) => {
      throw new Error("Not implementated")
    },
    stepWithOnOff: async ({ request:{}, attributes: { currentLevel } }) => {
      throw new Error("Not implementated")
    },
    stopWithOnOff: async ({ request:{}, attributes: { currentLevel } }) => {
      throw new Error("Not implementated")
    },
    moveToClosestFrequency: async ({request:{}, attributes: { /* currentFrequency */ } }) => { 
    // TODO: How to access or check existance of optional attribute?

      /* currentFrequency = frequency */
      throw new Error("Not implementated")
    }, 
});
