/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export function singleton<T>(create: () => T) {
    var instance: T | undefined;
    return () => {
        if (instance === undefined) instance = create();
        return instance;
    };
}
