
export const enum Policy {
    trustFirst = 0,
    cacheAndSync = 1,
};

export class KeySet {
    private numKeysUsed = 1;

    constructor(
        private readonly id: number,
        private readonly policy: Policy,
        private readonly key: Buffer) {}
}