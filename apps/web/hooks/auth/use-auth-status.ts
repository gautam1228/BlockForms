"use client";

import { useUser } from "~/hooks/api/auth";

/** Avoids flashing guest auth UI while the session is loading or being refreshed. */
export function useAuthStatus() {
    const { user, isFetched, isFetching } = useUser();

    const sessionReady = isFetched && !isFetching;
    const isLoggedIn = Boolean(user?.id && user.emailVerified);
    const showGuestAuth = sessionReady && !user?.id;

    return {
        user,
        isLoggedIn,
        showGuestAuth,
        showAuthedNav: sessionReady && isLoggedIn,
    };
}
