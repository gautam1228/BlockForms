import { TRPCClientError, observable, type TRPCLink } from "@repo/trpc/client";
import type { ServerRouter } from "@repo/trpc/client";

import { toast } from "~/lib/toast";
import { isRateLimitError, userErrorMessage } from "~/lib/user-error";

let lastRateLimitToastAt = 0;

function toastRateLimitOnce(error: unknown) {
    const now = Date.now();
    if (now - lastRateLimitToastAt < 2_000) return;
    lastRateLimitToastAt = now;

    toast.error(userErrorMessage(error, "Too many requests. Please wait a moment and try again."));
}

/** Shows a deduped toast when any procedure hits a rate limit. */
export const rateLimitToastLink: TRPCLink<ServerRouter> = () => {
    return ({ next, op }) => {
        return observable((observer) => {
            const subscription = next(op).subscribe({
                next(value) {
                    observer.next(value);
                },
                error(err) {
                    if (isRateLimitError(err) || isHttp429(err)) {
                        toastRateLimitOnce(err);
                    }
                    observer.error(err);
                },
                complete() {
                    observer.complete();
                },
            });

            return () => subscription.unsubscribe();
        });
    };
};

function isHttp429(error: unknown): boolean {
    return (
        error instanceof TRPCClientError &&
        typeof error.message === "string" &&
        /429|too many/i.test(error.message)
    );
}
