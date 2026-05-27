import { TRPCClientError } from "@repo/trpc/client";

const DEFAULT_RATE_LIMIT_MESSAGE = "Too many requests. Please wait a moment and try again.";

const AUTH_RATE_LIMIT_MESSAGE = "Too many authentication attempts. Please try again later.";

/** Detects DB / stack / driver errors that must not reach the client. */
function isTechnicalErrorMessage(message: string): boolean {
    if (!message.trim()) return true;
    return (
        /failed query|insert into|delete from|update .* set|select .* from|violates .* constraint|duplicate key|ECONNREFUSED|ECONNRESET|connection terminated|syntax error at/i.test(
            message,
        ) ||
        message.includes("params:") ||
        message.includes("\n    at ")
    );
}

function extractTrpcMessage(error: unknown): string | null {
    if (error instanceof TRPCClientError) {
        const message = error.message?.trim();
        return message || null;
    }
    if (error instanceof Error) {
        const message = error.message?.trim();
        return message || null;
    }
    return null;
}

export function isRateLimitError(error: unknown): boolean {
    if (error instanceof TRPCClientError) {
        return error.data?.code === "TOO_MANY_REQUESTS";
    }
    const message = extractTrpcMessage(error)?.toLowerCase() ?? "";
    return (
        message.includes("too many requests") ||
        message.includes("too many authentication attempts")
    );
}

/**
 * Returns a user-safe message. Server-side technical errors are replaced with
 * the fallback; safe messages (including rate limits) are shown as-is.
 */
export function userErrorMessage(error: unknown, fallback: string): string {
    if (isRateLimitError(error)) {
        const message = extractTrpcMessage(error);
        if (message && !isTechnicalErrorMessage(message)) {
            return message;
        }
        if (
            typeof error === "object" &&
            error !== null &&
            "data" in error &&
            typeof (error as { data?: { path?: string } }).data?.path === "string" &&
            (error as { data: { path: string } }).data.path.startsWith("auth.")
        ) {
            return AUTH_RATE_LIMIT_MESSAGE;
        }
        return DEFAULT_RATE_LIMIT_MESSAGE;
    }

    const message = extractTrpcMessage(error);
    if (message && !isTechnicalErrorMessage(message)) {
        return message;
    }

    return fallback;
}

/** @deprecated Use `userErrorMessage` */
export const getTrpcErrorMessage = userErrorMessage;
