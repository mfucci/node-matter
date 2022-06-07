/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export function Singleton<T>(create: () => T) {
    var instance: T | undefined;

    return () => {
        return instance ?? (instance = create());
    }
}
