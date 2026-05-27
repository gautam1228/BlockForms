import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { createContext } from "./context";
import { getAccessTokenCookie } from "./utils/cookie";
import { userService } from "./services";
import {
    isTechnicalErrorMessage,
    logProcedureError,
    sanitizeClientErrorMessage,
} from "./utils/public-error";
import { assertRateLimit } from "./utils/rate-limit";

export const tRPCContext = initTRPC
    .meta<OpenApiMeta>()
    .context<typeof createContext>()
    .create({
        errorFormatter({ shape, error }) {
            if (isTechnicalErrorMessage(shape.message)) {
                logProcedureError(error.cause ?? error, { path: shape.data?.path });
            }
            return {
                ...shape,
                message: sanitizeClientErrorMessage(shape.message),
            };
        },
    });

const generalRateLimit = tRPCContext.middleware(async ({ ctx, next, path }) => {
    assertRateLimit(ctx.ipAddress, path, { windowMs: 60_000, max: 120 });
    return next();
});

const authRateLimit = tRPCContext.middleware(async ({ ctx, next, path }) => {
    assertRateLimit(ctx.ipAddress, path, {
        windowMs: 15 * 60_000,
        max: 20,
        message: "Too many authentication attempts. Please try again later.",
    });
    return next();
});

export const router = tRPCContext.router;

/** Default limit for public and authenticated API procedures. */
export const publicProcedure = tRPCContext.procedure.use(generalRateLimit);

/** Stricter limit for sign-in, sign-up, password reset, and token refresh. */
export const authPublicProcedure = tRPCContext.procedure.use(authRateLimit);

export const authenticatedProcedure = tRPCContext.procedure
    .use(generalRateLimit)
    .use(async (options) => {
        const { ctx } = options;
        const accessToken = getAccessTokenCookie(ctx);
        if (!accessToken) {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }
        try {
            const {
                verificationResult: { id, email, fullName, emailVerified },
            } = await userService.verifyAndDecodeUserToken(accessToken);

            return options.next({
                ctx: {
                    ...ctx,
                    user: { id, email, fullName, emailVerified },
                },
            });
        } catch {
            throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Unauthorized",
            });
        }
    });

/**
 * For endpoints that are reachable both signed-in and signed-out (e.g. public
 * form submission, public form viewing). Attaches `ctx.user` opportunistically
 * when the caller happens to have a valid access-token cookie; otherwise
 * leaves `ctx.user = null` and lets the request through.
 */
export const optionallyAuthenticatedProcedure = tRPCContext.procedure
    .use(generalRateLimit)
    .use(async (options) => {
        const { ctx } = options;
        const accessToken = getAccessTokenCookie(ctx);

        let user: {
            id: string;
            email: string;
            fullName: string;
            emailVerified: boolean;
        } | null = null;

        if (accessToken) {
            try {
                const { verificationResult } =
                    await userService.verifyAndDecodeUserToken(accessToken);
                user = {
                    id: verificationResult.id,
                    email: verificationResult.email,
                    fullName: verificationResult.fullName,
                    emailVerified: verificationResult.emailVerified,
                };
            } catch {
                user = null;
            }
        }

        return options.next({ ctx: { ...ctx, user } });
    });
