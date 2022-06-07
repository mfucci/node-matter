/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

const COMMON_PROFILE = 0x00000000;
const UNSPECIFIED_PROFILE = 0xFFFFFFFF;

export class TlvTag {
    constructor(
        readonly profile: number,
        readonly id: number) {}

    toNumber() {
        if (this.profile === UNSPECIFIED_PROFILE) return this.id;
        return this.profile << 64 + this.id;
    }

    toString() {
        if (this.profile === UNSPECIFIED_PROFILE) {
            if (this.id === 0xFFFFFFFF) {
                return "TagAnonymous";
            } else {
                return `TagContextSpecific(${this.id})`;
            }
        } else if (this.profile === COMMON_PROFILE) {
            return `TagCommon(${this.id})`;
        } else {
            return `TagVendor(${this.profile}, ${this.id})`;
        }
    }

    equals({profile, id}: TlvTag) {
        return this.profile === profile && this.id === id;
    }

    isAnonymous() {
        return this.equals(TlvTag.Anonymous);
    }

    isContextual() {
        return this.profile === UNSPECIFIED_PROFILE;
    }

    isCommon() {
        return this.profile === COMMON_PROFILE;
    }

    static readonly Anonymous = new TlvTag(UNSPECIFIED_PROFILE, 0xFFFFFFFF);
    static readonly contextual = (id: number) => new TlvTag(UNSPECIFIED_PROFILE, id);
}
