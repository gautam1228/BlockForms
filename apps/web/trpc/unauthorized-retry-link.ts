import { TRPCClientError, observable, type TRPCLink } from "@repo/trpc/client";
import type { ServerRouter } from "@repo/trpc/client";

import { ensureSessionRefreshed } from "~/trpc/session-refresh";

const SKIP_RETRY_PATHS = new Set([
    "auth.refreshSession",
    "auth.signInUserWithEmailAndPassword",
    "auth.createUserWithEmailAndPassword",
    "auth.signOut",
]);

function isUnauthorizedError(err: unknown): boolean {
    return err instanceof TRPCClientError && err.data?.code === "UNAUTHORIZED";
}

export const unauthorizedRetryLink: TRPCLink<ServerRouter> = () => {
    return ({ next, op }) => {
        return observable((observer) => {
            let disposed = false;
            let innerSub: { unsubscribe: () => void } | undefined;

            const attempt = (retryCount: number) => {
                innerSub?.unsubscribe();
                innerSub = next(op).subscribe({
                    next(value) {
                        observer.next(value);
                    },
                    error(err) {
                        if (disposed) return;

                        const shouldRetry =
                            retryCount === 0 &&
                            isUnauthorizedError(err) &&
                            !SKIP_RETRY_PATHS.has(op.path);

                        if (!shouldRetry) {
                            observer.error(err);
                            return;
                        }

                        void ensureSessionRefreshed()
                            .then((ok) => {
                                if (disposed) return;
                                if (ok) attempt(1);
                                else observer.error(err);
                            })
                            .catch(() => {
                                if (!disposed) observer.error(err);
                            });
                    },
                    complete() {
                        observer.complete();
                    },
                });
            };

            attempt(0);

            return () => {
                disposed = true;
                innerSub?.unsubscribe();
            };
        });
    };
};
