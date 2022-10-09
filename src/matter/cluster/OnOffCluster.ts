/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { BooleanT } from "../../codec/TlvObjectCodec";
import { AttributeSpec, ClusterSpec, CommandSpec, NoArgumentsT, NoResponseT } from "./ClusterSpec";

export const OnOffClusterSpec = ClusterSpec(
    0x06,
    "On/Off",
    {
        on: AttributeSpec(0, BooleanT),
    },
    {
        off: CommandSpec(0, NoArgumentsT, 0, NoResponseT),
        on: CommandSpec(1, NoArgumentsT, 1, NoResponseT),
        toggle: CommandSpec(2, NoArgumentsT, 2, NoResponseT),
    },
);
