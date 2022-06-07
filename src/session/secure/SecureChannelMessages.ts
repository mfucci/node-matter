/**
 * @license
 * Copyright 2022 Marco Fucci di Napoli (mfucci@gmail.com)
 * SPDX-License-Identifier: Apache-2.0
 */

export const SECURE_CHANNEL_PROTOCOL_ID = 0x00000000;

export const enum MessageType {
    PbkdfParamRequest = 0x20,
    PbkdfParamResponse = 0x21,
    PasePake1 = 0x22,
    PasePake2 = 0x23,
    PasePake3 = 0x24,
    Sigma1 = 0x30,
    Sigma2 = 0x31,
    Sigma3 = 0x32,
    Sigma2Resume = 0x33,
    StatusReport = 0x40,
}

export const enum ProtocolStatusCode {
    Success = 0x0000,
    InvalidParam = 0x0002,
}

export const enum GeneralStatusCode {
    Success = 0x0000,
    Error = 0x0001,
}
