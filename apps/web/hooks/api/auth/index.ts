import { trpc } from "~/trpc/client";

export const useSignup = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: createUserWithEmailAndPasswordAsync,
        mutate: createUserWithEmailAndPassword,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
    } = trpc.auth.createUserWithEmailAndPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });

    return {
        createUserWithEmailAndPasswordAsync,
        createUserWithEmailAndPassword,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
    };
};

export const useSignIn = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: signInUserWithEmailAndPasswordAsync,
        mutate: signInUserWithEmailAndPassword,
        data,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
        reset,
    } = trpc.auth.signInUserWithEmailAndPassword.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });

    return {
        signInUserWithEmailAndPasswordAsync,
        signInUserWithEmailAndPassword,
        data,
        error,
        failureCount,
        isIdle,
        isSuccess,
        status,
        reset,
    };
};

export const useVerifyEmail = () => {
    const {
        mutateAsync: verifyEmailAsync,
        mutate: verifyEmail,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        isError,
        status,
    } = trpc.auth.verifyEmail.useMutation();

    return {
        verifyEmailAsync,
        verifyEmail,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        isError,
        status,
    };
};

export const useResendVerificationEmail = () => {
    const {
        mutateAsync: resendVerificationEmailAsync,
        mutate: resendVerificationEmail,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        status,
    } = trpc.auth.resendVerificationEmail.useMutation();

    return {
        resendVerificationEmailAsync,
        resendVerificationEmail,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        status,
    };
};

export const useUser = () => {
    const {
        data: user,
        error,
        isFetched,
        isFetching,
        isLoading,
        isError,
        status,
        refetch,
    } = trpc.auth.getLoggedInUserInfo.useQuery(undefined, {
        retry: false,
    });

    return { user, error, isFetched, isFetching, isLoading, isError, status, refetch };
};

export const useRequestPasswordReset = () => {
    const {
        mutateAsync: requestPasswordResetAsync,
        mutate: requestPasswordReset,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        status,
    } = trpc.auth.requestPasswordReset.useMutation();

    return {
        requestPasswordResetAsync,
        requestPasswordReset,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        status,
    };
};

export const useResetPassword = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: resetPasswordAsync,
        mutate: resetPassword,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        isError,
        status,
    } = trpc.auth.resetPassword.useMutation({
        onSuccess: async () => {
            // Reset invalidates server-side cookies, so refresh client cache too.
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });

    return {
        resetPasswordAsync,
        resetPassword,
        data,
        error,
        isIdle,
        isPending,
        isSuccess,
        isError,
        status,
    };
};

export const useRefreshSession = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: refreshSessionAsync,
        mutate: refreshSession,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        status,
    } = trpc.auth.refreshSession.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });

    return {
        refreshSessionAsync,
        refreshSession,
        data,
        error,
        isPending,
        isSuccess,
        isError,
        status,
    };
};

export const useUpdateProfile = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: updateProfileAsync,
        mutate: updateProfile,
        error,
        isPending,
        isSuccess,
        status,
    } = trpc.auth.updateProfile.useMutation({
        onSuccess: async () => {
            await utils.auth.getLoggedInUserInfo.invalidate();
        },
    });

    return {
        updateProfileAsync,
        updateProfile,
        error,
        isPending,
        isSuccess,
        status,
    };
};

export const useSignOut = () => {
    const utils = trpc.useUtils();
    const {
        mutateAsync: signOutAsync,
        mutate: signOut,
        error,
        isPending,
        isSuccess,
        status,
    } = trpc.auth.signOut.useMutation({
        onSuccess: async () => {
            utils.auth.getLoggedInUserInfo.reset();
        },
    });

    return {
        signOutAsync,
        signOut,
        error,
        isPending,
        isSuccess,
        status,
    };
};
