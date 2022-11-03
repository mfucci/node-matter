/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT } from "../../codec/DataModels";
import { Attribute, Cluster, Command, NoArgumentsT, NoResponseT } from "./Cluster";

export const OnOffCluster = Cluster({
    id: 0x06,
    name: "On/Off",
    attributes: {
        on: Attribute(0, BooleanT),
    },
    commands: {
        off: Command(0, NoArgumentsT, 0, NoResponseT),
        on: Command(1, NoArgumentsT, 1, NoResponseT),
        toggle: Command(2, NoArgumentsT, 2, NoResponseT),
    },
});
