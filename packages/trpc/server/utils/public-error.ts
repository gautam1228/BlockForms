import { TRPCError } from "@trpc/server";
import { logger } from "@repo/logger";

/** Detects DB / stack / driver errors that must not reach the client. */
export function isTechnicalErrorMessage(message: string): boolean {
    if (!message.trim()) return true;
    return (
        /failed query|insert into|delete from|update .* set|select .* from|violates .* constraint|duplicate key|ECONNREFUSED|ECONNRESET|connection terminated|syntax error at/i.test(
            message,
        ) ||
        message.includes("params:") ||
        message.includes("\n    at ")
    );
}

export function logProcedureError(error: unknown, meta?: { path?: string }) {
    logger.error("Procedure failed", {
        path: meta?.path,
        err: error instanceof Error ? error : undefined,
        message: error instanceof Error ? error.message : String(error),
    });
}

type PublicErrorCode = TRPCError["code"];

/**
 * Logs the underlying failure and returns a tRPC error with a safe client message.
 */
export function toPublicTRPCError(
    error: unknown,
    fallbackMessage: string,
    meta?: { path?: string; code?: PublicErrorCode },
): TRPCError {
    logProcedureError(error, meta);

    let code: PublicErrorCode = meta?.code ?? "INTERNAL_SERVER_ERROR";

    if (!meta?.code && error instanceof Error) {
        if (error.message === "Form not found." || error.message === "Submission not found.") {
            code = "NOT_FOUND";
        } else if (error.message === "You do not have access to this form.") {
            code = "FORBIDDEN";
        } else if (!isTechnicalErrorMessage(error.message)) {
            code = "BAD_REQUEST";
        }
    }

    return new TRPCError({ code, message: fallbackMessage });
}

/** Last-resort sanitizer for errors that bypass route-level handling. */
export function sanitizeClientErrorMessage(message: string): string {
    if (isTechnicalErrorMessage(message)) {
        return "Something went wrong. Please try again.";
    }
    return message;
}
