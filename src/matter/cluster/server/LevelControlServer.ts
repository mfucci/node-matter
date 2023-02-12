/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LevelControlCluster } from "../LevelControlCluster";
import { ClusterServerHandlers } from "./ClusterServer";

/*
TODO:  I'm just guessing here - not clear about how parameters get passed
*/

export const LevelControlClusterHandler: () => ClusterServerHandlers<typeof LevelControlCluster> = () => ({
    moveToLevel: async ({ request:{level, transitionTime, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + transitionTime + '*************************************' + level );  
      currentLevel.set(level);
    },
    move: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + rate + '*************************************' + moveMode );
    },
    step: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + stepSize + '*************************************' + stepMode );
    },
    stop: async ({ request:{ optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('***************************** stop   *************************************'  );
    },
/*
    moveToLevelWithOnOff: async ({ request:{level, transitionTime, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + transitionTime + '*************************************' + level );  
      currentLevel.set(level);
    },
    moveWithOnOff: async ({ request:{moveMode, rate, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + rate + '*************************************' + moveMode );
    },
    stepWithOnOff: async ({ request:{stepMode, stepSize, optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('*****************************' + stepSize + '*************************************' + stepMode );
      currentLevel.set(0);
    },
    stopWithOnOff: async ({ request:{ optionsMask, optionsOverride}, attributes: { currentLevel } }) => {
      console.log('***************************** stopWithOnOff   *************************************'  );
    },
    moveToClosestFrequency: async ({ request:{ frequency}, attributes: { currentLevel } }) => {
      console.log('*****************************    *************************************'  );
    },
*/

});
