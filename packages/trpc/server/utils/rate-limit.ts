import { TRPCError } from "@trpc/server";

import { getClientIp } from "./client-ip";

type RateLimitOptions = {
    windowMs: number;
    max: number;
    message?: string;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number) {
    if (buckets.size < 10_000) return;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export function consumeRateLimit(
    key: string,
    options: RateLimitOptions,
): { allowed: true } | { allowed: false; message: string } {
    const message = options.message ?? "Too many requests. Please wait a moment and try again.";

    const now = Date.now();
    pruneExpired(now);

    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true };
    }

    if (bucket.count >= options.max) {
        return { allowed: false, message };
    }

    bucket.count += 1;
    return { allowed: true };
}

/** Express middleware — outer safety net for all HTTP routes. */
export function createExpressRateLimit(options: RateLimitOptions & { keyPrefix?: string }) {
    const message = options.message ?? "Too many requests. Please wait a moment and try again.";

    return (
        req: Parameters<typeof getClientIp>[0],
        res: { status: (n: number) => { json: (b: unknown) => void } },
        next: () => void,
    ) => {
        const ip = getClientIp(req) ?? "unknown";
        const key = `${options.keyPrefix ?? "express"}:${ip}`;
        const result = consumeRateLimit(key, options);

        if (!result.allowed) {
            res.status(429).json({ message: result.message });
            return;
        }

        next();
    };
}

export type RateLimitConfig = RateLimitOptions;

export function assertRateLimit(ipAddress: string | null, path: string, options: RateLimitOptions) {
    const key = `${ipAddress ?? "unknown"}:${path}`;
    const result = consumeRateLimit(key, options);

    if (!result.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: result.message });
    }
}
