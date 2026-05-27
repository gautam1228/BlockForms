"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useRefreshSession, useUser } from "~/hooks/api/auth";

/**
 * Used by public auth pages (login, signup, forgot/reset password, etc.) to
 * bounce already-signed-in users away to `redirectTo`.
 *
 * Behavior:
 * - If `getLoggedInUserInfo` succeeds and the user is verified, redirect to
 *   `redirectTo` immediately.
 * - If it errors (no/expired access token), try `refreshSession` exactly once.
 *   On success the user query refetches and this effect re-runs to redirect.
 *   On failure we stay on the current page so the user can sign in / continue
 *   the auth flow they're on.
 */
export function useRedirectIfAuthenticated(redirectTo: string = "/dashboard") {
    const router = useRouter();
    const { user, isLoading: isUserLoading, isError: isUserError } = useUser();
    const { refreshSessionAsync, isPending: isRefreshing } = useRefreshSession();

    const refreshAttemptedRef = useRef(false);

    useEffect(() => {
        if (isUserLoading) return;

        if (user?.id && user.emailVerified) {
            router.replace(redirectTo);
            return;
        }
        // Unverified sessions stay on the current page (e.g. check-inbox, email link).
        // `/verify-email` is only for links that include `?token=…`.

        if (isUserError && !refreshAttemptedRef.current && !isRefreshing) {
            refreshAttemptedRef.current = true;
            refreshSessionAsync({}).catch(() => {
                // No valid refresh token either — stay on the current page.
            });
        }
    }, [user, isUserLoading, isUserError, isRefreshing, refreshSessionAsync, router, redirectTo]);

    return {
        user,
        isCheckingAuth: isUserLoading || isRefreshing,
    };
}
