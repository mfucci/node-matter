/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    OnOffCluster, OnOffDelayedAllOffEffectVariant, OnOffDyingLightEffectVariant, OnOffEffectIdentifier
} from "../OnOffCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { AttributeServer } from "./AttributeServer";

/*
TODO: Global Cluster fields needs to be added also here because, as discussed, based on the implementation.
* Cluster Revision: 4 (If I get it right from the Specs - Application Cluster Specs 1.5.1)
* FeatureMap: Bit 0 should be set when it is a "lighting" usecase AND Level Control cluster is supported
* AttributeList:
  * Supported always: onOff, onTime, offWaitTime
  * Supported if we have a scene cluster: globalSceneControl
  * Not supported: startUpOnOff
* AcceptedCommandList:
  * Supported always: Off, On, Toggle, OnWithTimedOff
  * Supported if we have a scene cluster: onWithRecallGlobalScene
  * Supported if we have a Level cluster: OffWithEffect
* GeneratedCommandList: empty
* EventList: empty
* FabricIndex: empty
 */

/*
TODO: If the Scenes server cluster is implemented on the same endpoint, the following extension field SHALL
      be added to the Scene Table:
      * OnOff
 */

export const OnOffClusterHandler: () => ClusterServerHandlers<typeof OnOffCluster> = () => ({
    // TODO In fact for the Cluster server implementation we need "initialization code" or thinks like this.
    //      I know that it is the wrong place in the "Handlers" object, but I don't know where to put it right now
    //      because it should be "bound to the cluster instance" and not to the "cluster type".
    //      Yes could also be build without the subscriptions, but so the code is separated from the other implementation
    //      parts and if used as library and the "specific device implementation" manipulates onTime or offWaitTime then
    //      it is all handled automatically and pot. not missed.
    constructor: ({ attributes: { onOff, onTime, offWaitTime, globalSceneControl } }) => {
        this.onTimeTimeout: NodeJS.Timeout | null = null;
        onTime.addMatterListener((value) => {
            if (this.onTimeTimeout) {
                clearTimeout(this.onTimeTimeout);
                this.onTimeTimeout = null;
            }
            if (value === 0) {
                offWaitTime.set(0);
                onOff.set(false);
            }
            if (value > 0 && onOff.get()) {
                // TODO This is the 100% accurate impelementation right now ...
                //      maybe could be optimized without a "100ms timeout loop",
                //      but for now should do exactly what specs say
                this.onTimeTimeout = setTimeout(() => {
                    this.onTimeTimeout = null;
                    onTime.set(value - 1);
                }, 100);
            }
        });

        this.offWaitTimeout: NodeJS.Timeout | null = null;
        offWaitTime.addMatterListener((value) => {
            if (this.offWaitTimeout) {
                clearTimeout(this.offWaitTimeout);
                this.offWaitTimeout = null;
            }
            if (value > 0 && !onOff.get()) {
                this.offWaitTimeout = setTimeout(() => {
                    this.offWaitTimeout = null;
                    offWaitTime.set(value - 1);
                }, 100);
            }
        });
    },
    // TODO The trick that we used in Device.ts to access "optionalAttributes" ... how to do it here?
    //      In fact I need to get globalSceneControl
    on: async ({ attributes: { onOff, onTime, offWaitTime, globalSceneControl } }) => {
        onOff.set(true);
        globalSceneControl.set(true);
        if (onTime.get() === 0) {
            offWaitTime.set(0);
        }
    },
    off: async ({ attributes: { onOff, onTime, offWaitTime } }) => {
        onOff.set(false);
        onTime.set(0);
    },
    toggle: async ({ attributes: { onOff, onTime, offWaitTime } }) => {
        if (onOff.get()) {
            onOff.set(false);
            onTime.set(0);
        } else {
            onOff.set(true);
            if (onTime.get() === 0) {
                offWaitTime.set(0);
            }
        }
    },
    offWithEffect: async ({request: { effectId, effectVariant}, attributes: { onOff, globalSceneControl } }) => {
        // TODO implement logic with globalSceneControl, but before:
        // globalSceneControl controls if "the server SHALL store its settings in its global scene" ... we need to add that first

        if (globalSceneControl.get()) {
            // TODO store settings in global scene
            globalSceneControl.set(false);
        }
        // The global scene is defined as the scene that is stored with group identifier 0 and scene identifier 0.

        // Just example implementation for now, I would more assume because we do not support dimming that
        // we should just set off directly without delay?
        // TODO In my eyes we need to access the "Level cluster" on the same endpoint to control the fading/dimming and such
        switch (effectId) {
            case OnOffEffectIdentifier.DelayedAllOff:
                switch (effectVariant) {
                    case OnOffDelayedAllOffEffectVariant.FadeToOffIn_0p8Seconds:
                        setTimeout(() => onOff.set(false), 800);
                        break;
                    case OnOffDelayedAllOffEffectVariant.NoFade:
                        onOff.set(false);
                        break;
                    case OnOffDelayedAllOffEffectVariant["50PercentDimDownIn_0p8SecondsThenFadeToOffIn_12Seconds"]:
                        setTimeout(() => onOff.set(false), 12800);
                        break;
                }
                break;
            case OnOffEffectIdentifier.DyingLight:
                switch (effectVariant) {
                    case OnOffDyingLightEffectVariant["20PercentDimUpIn_0p5SecondsThenFadeToOffIn_1Second"]:
                        setTimeout(() => onOff.set(false), 1500);
                        break;
                }
                break;
        }
    },
    onWithRecallGlobalScene: async ({ attributes: { onOff, globalSceneControl } }) => {
        if (globalSceneControl.get()) {
            return; // discard command
        }
        // TODO the Scene cluster server on the same endpoint SHALL recall its global scene, updating the OnOff
        //      attribute accordingly. The OnOff server SHALL then set the GlobalSceneControl attribute to TRUE.
        // if onOff set to TRUE during recalling option, set the GlobalSceneControl attribute to FALSE.
    },
    onWithTimedOff: async ({  request: { onOffControl, onTime, offWaitTime }, attributes: { onOff, offWaitTime: offWaitTimeAttr, onTime: onTimeAttr } }) => {
        const onOffValue = onOff.get();
        if (onOffControl === 1 && !onOffValue) { // TODO adjust onOffControl check when the bit map type is implemented
            return; // discard command
        }
        if (offWaitTimeAttr.get() > 0 && !onOffValue) {
            offWaitTimeAttr.set(Math.min(offWaitTime, offWaitTimeAttr.get() || 0));
        } else {
            onTimeAttr.set(Math.max(onTimeAttr.get(), onTime));
            offWaitTimeAttr.set(offWaitTime);
            onOff.set(true);
        }
    },
});
