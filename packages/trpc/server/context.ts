import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createCookieFactory, getCookieFactory, clearCookieFactory } from "./utils/cookie";
import { getClientIp, getUserAgent } from "./utils/client-ip";

export interface TRPCCtxUser {
    id: string;
    email: string;
    fullName: string;
    emailVerified: boolean;
}

export interface TRPCContext {
    createCookie: ReturnType<typeof createCookieFactory>;
    getCookie: ReturnType<typeof getCookieFactory>;
    clearCookie: ReturnType<typeof clearCookieFactory>;

    user: TRPCCtxUser | null;
    ipAddress: string | null;
    userAgent: string | null;
}

export function createContext({ req, res }: CreateExpressContextOptions): TRPCContext {
    const ctx: TRPCContext = {
        createCookie: createCookieFactory(res),
        getCookie: getCookieFactory(req),
        clearCookie: clearCookieFactory(res),
        user: null,
        ipAddress: getClientIp(req),
        userAgent: getUserAgent(req),
    };

    return ctx;
}

export type Context = Awaited<ReturnType<typeof createContext>>;
