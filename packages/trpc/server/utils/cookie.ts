import { CookieOptions, Request, Response } from "express";
import { TRPCContext } from "../context";

const ONE_MINUTE = 60 * 1000; // ms
const ONE_HOUR = 60 * ONE_MINUTE;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 12 * ONE_MONTH;

const cookieSecure =
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

const defaultCookieOptions: CookieOptions = {
    path: "/",
    httpOnly: true,
    secure: cookieSecure,
    sameSite: "strict",
    maxAge: ONE_DAY, // 24 Hours
};

export function createCookieFactory(res: Response) {
    return function createCookie(
        name: string,
        value: string,
        opts: CookieOptions = defaultCookieOptions,
    ) {
        res.cookie(name, value, opts);
    };
}

export function getCookieFactory(req: Request) {
    return function getCookie(name: string) {
        return req.cookies?.[name];
    };
}

export function clearCookieFactory(res: Response) {
    return function clearCookie(name: string) {
        res.clearCookie(name);
    };
}

// Authorization Cookies
const ACCESS_TOKEN_COOKIE_NAME = "access-token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh-token";

export function setAccessTokenCookie(ctx: TRPCContext, accessToken: string) {
    ctx.createCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken);
}

export function getAccessTokenCookie(ctx: TRPCContext) {
    return ctx.getCookie(ACCESS_TOKEN_COOKIE_NAME);
}

export function setRefreshTokenCookie(ctx: TRPCContext, refreshToken: string) {
    ctx.createCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken);
}

export function getRefreshTokenCookie(ctx: TRPCContext) {
    return ctx.getCookie(REFRESH_TOKEN_COOKIE_NAME);
}

export function clearAuthTokenCookies(ctx: TRPCContext) {
    ctx.clearCookie(ACCESS_TOKEN_COOKIE_NAME);
    ctx.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
}
