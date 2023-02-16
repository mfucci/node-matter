/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelControlCluster } from "../LevelControlCluster";
import { ClusterServerHandlers } from "./ClusterServer";

/*
TODO:  not clear about how parameters get passed and returned. And there is logic
that needs to be added for changing other clusters from the WithOnOff commands and to
set attributes other than currentLevel

The moveToLevel commands have been tested in Google Home and in Alexa
*/

export const LevelControlClusterHandler: () => ClusterServerHandlers<typeof LevelControlCluster> = () => ({
    moveToLevel: async ({ request:{level, transitionTime, optionsMask, optionsOverride}, attributes: { currentLevel } }) => { 
      currentLevel.set(level);
    }, 
//    move: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
//    step: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
//    stop: async ({ request:{ optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
    
    moveToLevelWithOnOff: async function ({ request: { level, optionsOverride }, attributes: { currentLevel } }) {
      // TODO Need to set the On/Off Attribute of the associated OnOff device
      currentLevel.set(level);
    },
  
//    moveWithOnOff: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
//    stepWithOnOff: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
//    stopWithOnOff: async ({ request:{optionsMask, optionsOverride}, attributes: { currentLevel } }) => {},
//    moveToClosestFrequency: async ({request:{ frequency, }, attributes: { currentLevel } }) => {}, 
});
