import crypto from "node:crypto";

import * as JWT from "jsonwebtoken";
import {
    generateUserAccessTokenPayload,
    GenerateUserAccessTokenPayloadType,
    generateUserRefreshTokenPayload,
    GenerateUserRefreshTokenPayloadType,
} from "../user/model";
import { env } from "../env";

type TokenAndHashToken = {
    token: string;
    hashedToken: string;
};

export const hashToken = (token: string): string =>
    crypto.createHash(env.HASHING_ALGORITHM).update(token).digest("hex");

export const generateTokenAndHashedTokenPair = (): TokenAndHashToken => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash(env.HASHING_ALGORITHM).update(token).digest("hex");

    return {
        token,
        hashedToken,
    };
};

export const generateUserAccessToken = async (payload: GenerateUserAccessTokenPayloadType) => {
    const { id, email, fullName } = await generateUserAccessTokenPayload.parseAsync(payload);

    const accessToken = JWT.sign({ id, email, fullName }, env.JWT_ACCESS_SECRET, {
        expiresIn: env.JWT_ACCESS_EXPIRES as JWT.SignOptions["expiresIn"],
    });

    return { accessToken };
};

export const generateUserRefreshToken = async (payload: GenerateUserRefreshTokenPayloadType) => {
    const { id } = await generateUserRefreshTokenPayload.parseAsync(payload);

    const refreshToken = JWT.sign({ id }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES as JWT.SignOptions["expiresIn"],
    });

    return { refreshToken };
};
