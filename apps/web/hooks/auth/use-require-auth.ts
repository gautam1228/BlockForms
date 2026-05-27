"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useRefreshSession, useUser } from "~/hooks/api/auth";

/**
 * Redirects unauthenticated users to `/login`. Mirrors the refresh-once
 * behavior from `useRedirectIfAuthenticated`.
 */
export function useRequireAuth(redirectTo = "/login") {
    const router = useRouter();
    const { user, isLoading: isUserLoading, isError: isUserError } = useUser();
    const { refreshSessionAsync, isPending: isRefreshing } = useRefreshSession();
    const refreshAttemptedRef = useRef(false);

    useEffect(() => {
        if (isUserLoading || isRefreshing) return;

        if (user?.id) {
            if (!user.emailVerified) {
                router.replace("/verify-email");
            }
            return;
        }

        if (isUserError && !refreshAttemptedRef.current) {
            refreshAttemptedRef.current = true;
            refreshSessionAsync({}).catch(() => {
                router.replace(redirectTo);
            });
            return;
        }

        if (!user && !isUserLoading) {
            router.replace(redirectTo);
        }
    }, [user, isUserLoading, isUserError, isRefreshing, refreshSessionAsync, router, redirectTo]);

    return {
        user,
        isAuthenticated: Boolean(user?.id && user.emailVerified),
        isCheckingAuth: isUserLoading || isRefreshing,
    };
}
