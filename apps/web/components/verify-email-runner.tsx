"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle2, MailCheck } from "lucide-react";

import { Spinner } from "~/components/ui/spinner";
import { useUser, useVerifyEmail } from "~/hooks/api/auth";
import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";
import { userErrorMessage } from "~/lib/user-error";

type VerifyEmailRunnerProps = {
    token: string | null;
};

export function VerifyEmailRunner({ token }: VerifyEmailRunnerProps) {
    // If the user already has a verified session, bounce them to the dashboard
    // (and try a refresh-session round-trip if the access token is missing).
    useRedirectIfAuthenticated("/dashboard");

    const { user, isLoading: isUserLoading } = useUser();
    const { verifyEmail, isPending, isSuccess, isError, data, error } = useVerifyEmail();

    // Strict-mode in dev double-invokes effects; guard so we only fire once per token.
    const triggeredRef = useRef<string | null>(null);

    useEffect(() => {
        if (!token) return;
        if (triggeredRef.current === token) return;
        triggeredRef.current = token;
        verifyEmail({ token });
    }, [token, verifyEmail]);

    if (!token) {
        if (isUserLoading) {
            return (
                <div className="mc-panel rounded-md p-8 bg-card text-center">
                    <div className="flex flex-col items-center gap-3 py-4">
                        <Spinner />
                        <p className="font-mc text-lg text-muted-foreground">Loading...</p>
                    </div>
                </div>
            );
        }

        if (user?.id && !user.emailVerified) {
            return (
                <div className="mc-panel rounded-md p-8 bg-card text-center">
                    <div className="mc-block bg-gold w-14 h-14 mx-auto mb-5 grid place-items-center">
                        <MailCheck className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="font-pixel text-base">CHECK YOUR INBOX</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-3">
                        Open the verification link we emailed you to activate your account.
                    </p>
                    <Link href="/verify-email/sent" className="inline-block mt-6">
                        <button className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px]">
                            VERIFICATION HELP
                        </button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="mc-panel rounded-md p-8 bg-card text-center">
                <div className="mc-block bg-redstone w-14 h-14 mx-auto mb-5 grid place-items-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-pixel text-base">MISSING TOKEN</h1>
                <p className="font-mc text-lg text-muted-foreground mt-3">
                    This verification link is missing a token. Please use the link from your email
                    exactly as it was sent.
                </p>
                <Link href="/login" className="inline-block mt-6">
                    <button className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px]">
                        BACK TO LOGIN
                    </button>
                </Link>
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="mc-panel rounded-md p-8 bg-card text-center">
                <div className="mc-block bg-diamond w-14 h-14 mx-auto mb-5 grid place-items-center animate-mc-spin">
                    <MailCheck className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-pixel text-base">VERIFYING EMAIL</h1>
                <div className="flex flex-col items-center gap-3 py-4 mt-2">
                    <Spinner />
                    <p className="font-mc text-lg text-muted-foreground">
                        Hang tight while we confirm your email...
                    </p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="mc-panel rounded-md p-8 bg-card text-center">
                <div className="mc-block bg-grass w-14 h-14 mx-auto mb-5 grid place-items-center">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-pixel text-base">EMAIL VERIFIED</h1>
                <p className="font-mc text-lg text-muted-foreground mt-3">
                    {data?.alreadyVerified
                        ? "Your email was already verified. You're good to go."
                        : "Your email is verified. You can now use your BlockForms account."}
                </p>
                <Link href="/login" className="inline-block mt-6">
                    <button className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px]">
                        CONTINUE TO LOGIN
                    </button>
                </Link>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="mc-panel rounded-md p-8 bg-card text-center">
                <div className="mc-block bg-redstone w-14 h-14 mx-auto mb-5 grid place-items-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                </div>
                <h1 className="font-pixel text-base">VERIFICATION FAILED</h1>
                <p className="font-mc text-lg text-destructive mt-3">
                    {userErrorMessage(
                        error,
                        "We couldn't verify your email. The link may have expired.",
                    )}
                </p>
                <Link href="/login" className="inline-block mt-6">
                    <button className="mc-block mc-block-stone bg-stone h-11 px-5 font-pixel text-[10px]">
                        BACK TO LOGIN
                    </button>
                </Link>
            </div>
        );
    }

    return null;
}
