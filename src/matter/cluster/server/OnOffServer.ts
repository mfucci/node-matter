/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    OnOffCluster, DelayedAllOffEffectVariant, DyingLightEffectVariant, EffectIdentifier
} from "../OnOffCluster";
import { ClusterServerHandlers } from "./ClusterServer";
import { AttributeServer } from "./AttributeServer";
import { Time, Timer } from "../../../time/Time";

/*
TODO: Global Cluster fields needs to be added also here because, as discussed, based on the implementation.
* Cluster Revision: 4 (If I get it right from the Specs - Application Cluster Specs 1.5.1)
* FeatureMap:
  * Bit 0 should be set when it is a "lighting" usecase AND Level Control cluster is supported
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

class OnOffClusterHandler2 implements ClusterServerHandlers<typeof OnOffCluster> {
    private onTimeTimeout: Timer | undefined;
    private offWaitTimeout: Timer | undefined;

    // TODO In fact for the Cluster server implementation we need "initialization code" or thinks like this.
    //      I know that it is the wrong place in the "Handlers" object, but I don't know where to put it right now
    //      because it should be "bound to the cluster instance" and not to the "cluster type".
    //      Yes could also be build without the subscriptions, but so the code is separated from the other implementation
    //      parts and if used as library and the "specific device implementation" manipulates onTime or offWaitTime then
    //      it is all handled automatically and pot. not missed.

    constructor() {
        // I know that "this attributes" is wrong ... :-)
        this.attributes.onTime.addMatterListener((value: number | null) => {
            this.onTimeTimeout?.stop();
            if (value === 0) {
                this.attributes.offWaitTime.set(0);
                this.attributes.onOff.set(false);
            }
            if (value === null || this.attributes.offWaitTime.get() === null) {
                return; // do nothing
            }
            if (value > 0 && this.attributes.onOff.get()) {
                // TODO This is the 100% accurate impelementation right now ...
                //      maybe could be optimized without a "100ms timeout loop",
                //      but for now should do exactly what specs say
                this.onTimeTimeout = Time.getTimer(100, () =>
                    this.attributes.onTime.set(value - 1)).start();
            }
        });

        this.attributes.offWaitTime.addMatterListener((value: number | null) => {
            this.offWaitTimeout?.stop();
            if (value === null || this.attributes.onTime.get() === null) {
                return; // do nothing
            }
            if (value > 0 && !this.attributes.onOff.get()) {
                this.offWaitTimeout = Time.getTimer(100, () =>
                    this.attributes.offWaitTime.set(value - 1)).start();
            }
        });
    }

}

// TODO
// We might need to differentiate if an attribute is set internally otr "by a write command from externally":
// From Specs: onTime: This attribute can be written at any time, but writing a value only has effect when in the
//             ‘Timed On’ state. See OnWithTimedOff Command for more details.
// From Specs: offWaitTime: This attribute can be written at any time, but writing a value only has an effect when
//             in the ‘Timed On’ state followed by a transition to the ‘Delayed Off' state, or in the ‘Delayed Off’
//             state.

export const OnOffClusterHandler: () => ClusterServerHandlers<typeof OnOffCluster> = () => ({
    // TODO The trick that we used in Device.ts to access "optionalAttributes" ... how to do it here?
    //      In fact I need to get globalSceneControl
    on: async ({ attributes: { onOff, onTime, offWaitTime/*, globalSceneControl*/ } }) => {
        onOff.set(true);
        // TODO When implementing Scenes cluster
        //globalSceneControl.set(true);
        if (onTime.get() === 0) {
            offWaitTime.set(0);
        }
    },
    off: async ({ attributes: { onOff, onTime} }) => {
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
    // TODO document out until LevelControl and SceneControl is existing
    offWithEffect: async ({request: { effectIdentifier, effectVariant}, attributes: { onOff/*, globalSceneControl*/ } }) => {
        // TODO implement logic with globalSceneControl, but before:
        // globalSceneControl controls if "the server SHALL store its settings in its global scene" ... we need to add that first
        //if (globalSceneControl.get()) {
        //    // TODO store settings in global scene
        //    globalSceneControl.set(false);
        //}
        // The global scene is defined as the scene that is stored with group identifier 0 and scene identifier 0.

        // Just example implementation for now, I would more assume because we do not support dimming that
        // we should just set off directly without delay?
        // TODO In my eyes we need to access the "Level cluster" on the same endpoint to control the fading/dimming and such
        switch (effectIdentifier) {
            case EffectIdentifier.DelayedAllOff:
                switch (effectVariant) {
                    case DelayedAllOffEffectVariant.Fade:
                        setTimeout(() => onOff.set(false), 800);
                        break;
                    case DelayedAllOffEffectVariant.NoFade:
                        onOff.set(false);
                        break;
                    case DelayedAllOffEffectVariant["DimDownThenFade"]:
                        setTimeout(() => onOff.set(false), 12800);
                        break;
                }
                break;
            case EffectIdentifier.DyingLight:
                switch (effectVariant) {
                    case DyingLightEffectVariant["DimUpThenFade"]:
                        setTimeout(() => onOff.set(false), 1500);
                        break;
                }
                break;
        }
    },
    onWithRecallGlobalScene: async ({ attributes: { onOff/*, globalSceneControl*/ } }) => {
        // TODO implement logic with globalSceneControl, but before:
        //if (globalSceneControl.get()) {
        //    return; // discard command
        //}
        // TODO the Scene cluster server on the same endpoint SHALL recall its global scene, updating the OnOff
        //      attribute accordingly. The OnOff server SHALL then set the GlobalSceneControl attribute to TRUE.
        // if onOff set to TRUE during recalling option, set the GlobalSceneControl attribute to FALSE.
    },
    onWithTimedOff: async ({  request: { onOffControl, onTime, offWaitTime }, attributes: { onOff, offWaitTime: offWaitTimeAttr, onTime: onTimeAttr } }) => {
        const onOffValue = onOff.get();
        if (onOffControl === 1 && !onOffValue) { // TODO adjust onOffControl check when the bit map type is implemented
            return; // discard command
        }
        if (!onOffValue && offWaitTimeAttr.get() > 0) {
            offWaitTimeAttr.set(Math.min(offWaitTime, offWaitTimeAttr.get()));
        } else {
            onTimeAttr.set(Math.max(onTimeAttr.get(), onTime));
            offWaitTimeAttr.set(offWaitTime);
            onOff.set(true);
        }
    },
});
