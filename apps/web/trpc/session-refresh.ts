import { env } from "~/env.js";

const TRPC_URL = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc";

let refreshPromise: Promise<boolean> | null = null;

async function callRefreshSession(): Promise<boolean> {
    const res = await fetch(`${TRPC_URL}/auth.refreshSession`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
    });

    if (!res.ok) return false;

    try {
        const json = (await res.json()) as { result?: { data?: unknown }; error?: unknown };
        return json.result?.data !== undefined && json.error === undefined;
    } catch {
        return false;
    }
}

/** Deduplicated refresh — concurrent UNAUTHORIZED responses share one in-flight call. */
export function ensureSessionRefreshed(): Promise<boolean> {
    if (!refreshPromise) {
        refreshPromise = callRefreshSession().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}
