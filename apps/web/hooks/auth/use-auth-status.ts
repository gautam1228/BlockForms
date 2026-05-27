"use client";

import { useUser } from "~/hooks/api/auth";

/** Avoids flashing guest auth UI while the session is loading or being refreshed. */
export function useAuthStatus() {
    const { user, isFetched, isFetching } = useUser();

    const isLoggedIn = Boolean(user?.id);
    const showGuestAuth = isFetched && !isFetching && !isLoggedIn;

    return {
        user,
        isLoggedIn,
        showGuestAuth,
        showAuthedNav: isLoggedIn,
    };
}
