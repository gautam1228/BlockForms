type RequestLike = {
    headers: Record<string, string | string[] | undefined>;
    socket: { remoteAddress?: string | null };
};

/** Resolves the client IP from proxy headers or the socket (max 45 chars for inet). */
export function getClientIp(req: RequestLike): string | null {
    const forwarded = req.headers["x-forwarded-for"];
    const raw =
        typeof forwarded === "string"
            ? forwarded.split(",")[0]?.trim()
            : Array.isArray(forwarded)
              ? forwarded[0]?.trim()
              : (req.socket.remoteAddress ?? null);

    if (!raw) return null;

    const normalized = raw.startsWith("::ffff:") ? raw.slice(7) : raw;
    return normalized.length > 45 ? normalized.slice(0, 45) : normalized;
}

export function getUserAgent(req: RequestLike): string | null {
    const ua = req.headers["user-agent"];
    return typeof ua === "string" ? ua : null;
}
