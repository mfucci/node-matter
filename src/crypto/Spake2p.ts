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
    iteration: number,
    salt: Buffer,
}

export class Spake2p {
    constructor(
        private readonly context: Buffer,
        private readonly random: BN,
        /* visible for tests */ readonly w0: BN,
        private readonly w1: BN,
    ) {}

    static async create(context: Buffer, {iteration, salt}: PbkdfParameters, pin: number) {
        const pinBytes = Buffer.alloc(4);
        pinBytes.writeUInt32LE(pin);
        const ws = await Crypto.pbkdf2(pinBytes, salt, iteration, 80);
        const random = Crypto.getRandomBN(32, P256_CURVE.p);
        const w0 = new BN(ws.slice(0, 40)).mod(P256_CURVE.n);
        const w1 = new BN(ws.slice(40, 80)).mod(P256_CURVE.n);
        return new Spake2p(context, random, w0, w1);
    }

    computeX(): Buffer {
        const X = P256_CURVE.g.mul(this.random).add(M.mul(this.w0));
        return Buffer.from(X.encode());
    }

    computeY(): Buffer {
        const Y = P256_CURVE.g.mul(this.random).add(N.mul(this.w0));
        return Buffer.from(Y.encode());
    }

    async computeSecretAndVerifiersFromY(X: Buffer, Y: Buffer) {
        const YPoint = P256_CURVE.decodePoint(Y);
        if (!YPoint.validate()) throw new Error("Y is not on the curve");
        const yNwo = YPoint.add(N.mul(this.w0).neg());
        const Z = yNwo.mul(this.random);
        const V = yNwo.mul(this.w1);
        return this.computeSecretAndVerifiers(X, Y, Buffer.from(Z.encode()), Buffer.from(V.encode()));
    }

    async computeSecretAndVerifiersFromX(X: Buffer, Y: Buffer) {
        const XPoint = P256_CURVE.decodePoint(X);
        if (!XPoint.validate()) throw new Error("X is not on the curve");
        const Z = XPoint.add(M.mul(this.w0).neg()).mul(this.random);
        const V = P256_CURVE.g.mul(this.w1).mul(this.random);
        return this.computeSecretAndVerifiers(X, Y, Buffer.from(Z.encode()), Buffer.from(V.encode()));
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
