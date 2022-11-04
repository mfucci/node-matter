/**
 * @license
 * Copyright 2022 The node-matter Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import BN from "bn.js";
import { ec } from "elliptic";
import { Crypto } from "./Crypto";

const P256_CURVE = new ec("p256").curve;

// M and N constants from https://datatracker.ietf.org/doc/html/draft-bar-cfrg-spake2plus-01
const M = P256_CURVE.decodePoint("02886e2f97ace46e55ba9dd7242579f2993b64e16ef3dcab95afd497333d8fa12f", "hex");
const N = P256_CURVE.decodePoint("03d8bbd6c639c62937b04d997f38c3770719c629d7014d49a24b4f98baa1292b49", "hex");

export interface PbkdfParameters {
    iterations: number,
    salt: Buffer,
}

export class Spake2p2 {
    constructor(
        private readonly context: Buffer,
        private readonly random: BN,
        /* visible for tests */ readonly w0: BN,
        private readonly L: BN,
    ) {}

    static async create(context: Buffer, verificationValue: Buffer) {
        const random = Crypto.getRandomBN(32, P256_CURVE.p);
        const w0 = new BN(verificationValue.slice(0, 32));
        const L = new BN(verificationValue.slice(32, 87));
        return new Spake2p2(context, random, w0, L);
    }

    computeX(): Buffer {
        const X = P256_CURVE.g.mul(this.random).add(M.mul(this.w0));
        return Buffer.from(X.encode());
    }

    computeY(): Buffer {
        const Y = P256_CURVE.g.mul(this.random).add(N.mul(this.w0));
        return Buffer.from(Y.encode());
    }

    async computeSecretAndVerifiersFromX(X: Buffer, Y: Buffer) {
        const XPoint = P256_CURVE.decodePoint(X);
        if (!XPoint.validate()) throw new Error("X is not on the curve");
        const Z = XPoint.add(M.mul(this.w0).neg()).mul(this.random);
        const V = this.L.mul(this.random);
        return this.computeSecretAndVerifiers(X, Y, Buffer.from(Z.encode()), Buffer.from(Z.encode.apply(V)));
    }

    private async computeSecretAndVerifiers(X: Buffer, Y: Buffer, Z: Buffer, V: Buffer) {
        const TT_HASH = this.computeTranscriptHash(X, Y, Z, V);
        const Ka = TT_HASH.slice(0, 16);
        const Ke = TT_HASH.slice(16, 32);

        const KcAB = await Crypto.hkdf(Ka, Buffer.alloc(0), Buffer.from("ConfirmationKeys"), 32);
        const KcA = KcAB.slice(0, 16);
        const KcB = KcAB.slice(16, 32);

        const hAY = Crypto.hmac(KcA, Y);
        const hBX = Crypto.hmac(KcB, X);

        return { Ke, hAY, hBX };
    }

    private computeTranscriptHash(X: Buffer, Y: Buffer, Z: Buffer, V: Buffer) {
        const TT = new Array<Buffer>();
        this.addToContext(TT, this.context);
        this.addToContext(TT, Buffer.from(""));
        this.addToContext(TT, Buffer.from(""));
        this.addToContext(TT, Buffer.from(M.encode()));
        this.addToContext(TT, Buffer.from(N.encode()));
        this.addToContext(TT, X);
        this.addToContext(TT, Y);
        this.addToContext(TT, Z);
        this.addToContext(TT, V);
        this.addToContext(TT, this.w0.toBuffer());
        return Crypto.hash(TT);
    }

    private addToContext(spakeContext: Buffer[], data: Buffer) {
        const sizeBuffer = Buffer.alloc(8);
        sizeBuffer.writeBigUInt64LE(BigInt(data.length));
        spakeContext.push(sizeBuffer);
        spakeContext.push(data);
    }
}
