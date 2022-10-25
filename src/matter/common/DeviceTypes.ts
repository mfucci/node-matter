/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEVICE = {
    // Utility Device Types
    AGGREGATOR: { name: "MA-aggregator", code: 0x000e },
    POWER_SOURCE: { name: "MA-powersource", code: 0x011 },
    OTA_REQUESTOR: { name: "MA-otarequestor", code: 0x012 },
    BRIDGED_DEVICE: { name: "MA-bridgeddevice", code: 0x0013 },
    OTA_PROVIDER: { name: "MA-otaprovider", code: 0x0014 },
    ROOT: { name: "MA-rootdevice", code: 0x0016 },

    // Application Device Types
    // - Lighting
    ON_OFF_LIGHT: { name: "MA-onofflight", code: 0x0100 },
    DIMMABLE_LIGHT: { name: "MA-dimmablelight", code: 0x0101 },
    COLOR_TEMPERATURE_LIGHT: { name: "MA-colortemperaturelight", code: 0x010c },
    EXTENDED_COLOR_LIGHT: { name: "MA-extendedcolorlight", code: 0x010d },

    // - Smart Plugs/outlets and other actuators
    ON_OFF_PLUGIN_UNIT: { name: "MA-onoffpluginunit", code: 0x010a },
    DIMMABLE_PLUGIN_UNIT: { name: "MA-dimmablepluginunit", code: 0x010b },
    PUMP: { name: "MA-pump", code: 0x0303 },

    // - Switches and Controls
    ON_OFF_LIGHT_SWITCH: { name: "MA-onofflightswitch", code: 0x0103 },
    DIMMER_SWITCH: { name: "MA-dimmerswitch", code: 0x0104 },
    COLOR_DIMMER_SWITCH: { name: "MA-colordimmerswitch", code: 0x0105 },
    CONTROL_BRIDGE: { name: "MA-controlbridge", code: 0x0840 },
    PUMP_CONTROLLER: { name: "MA-pumpcontroller", code: 0x0304 },
    GENERIC_SWITCH: { name: "MA-genericswitch", code: 0x000f },

    // - Sensors
    CONTACT_SENSOR: { name: "MA-contactsensor", code: 0x0015 },
    LIGHT_SENSOR: { name: "MA-lightsensor", code: 0x0106 },
    OCCUPANCY_SENSOR: { name: "MA-occupancysensor", code: 0x0107 },
    TEMPERATURE_SENSOR: { name: "MA-tempsensor", code: 0x0302 },
    PRESSURE_SENSOR: { name: "MA-pressuresensor", code: 0x0305 },
    FLOW_SENSOR: { name: "MA-flowsensor", code: 0x0306 },
    HUMIDITY_SENSOR: { name: "MA-humiditysensor", code: 0x0307 },
    ON_OFF_SENSOR: { name: "MA-onoffsensor", code: 0x0850 },

    // - Closures
    DOOR_LOCK: { name: "MA-doorlock", code: 0x000a },
    DOOR_LOCK_CONTROLLER: { name: "MA-doorlockcontroller", code: 0x000b },
    WINDOW_COVERING: { name: "MA-windowcovering", code: 0x0202 },
    WINDOW_COVERING_CONTROLLER: { name: "MA-windowcoveringcontroller", code: 0x0203 },

    // - HVAC
    HEATING_CONTROLLER: { name: "MA-heatcool", code: 0x0300 },
    THERMOSTAT: { name: "MA-thermostat", code: 0x0301 },
    FAN: { name: "MA-fan", code: 0x002b },

    // - Media
    BASIC_VIDEO_PLAYER: { name: "MA-basic-videoplayer", code: 0x0028 },
    CASTING_VIDEO_PLAYER: { name: "MA-casting-videoplayer", code: 0x0023 },
    SPEAKER: { name: "MA-speaker", code: 0x0022 },
    CONTENT_APP: { name: "MA-contentapp", code: 0x0024 },
    CASTING_VIDEO_CLIENT: { name: "MA-casting-videoclient", code: 0x0029 },
    VIDEO_REMOTE_CONTROL: { name: "MA-video-remotecontrol", code: 0x002a },

    // - Generic
    MODE_SELECT: { name: "MA-modeselect", code: 0x0027 },
}
