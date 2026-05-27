import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";
import { rateLimitToastLink } from "~/trpc/rate-limit-toast-link";
import { unauthorizedRetryLink } from "~/trpc/unauthorized-retry-link";

interface CreateTRPCHttpBatchClientClientOpts {
    enableStreaming?: boolean;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
    const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
    return [
        rateLimitToastLink,
        unauthorizedRetryLink,
        c({
            url: env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc",
            fetch(url, options) {
                return fetch(url, {
                    ...options,
                    credentials: "include",
                });
            },
        }),
    ];
};
