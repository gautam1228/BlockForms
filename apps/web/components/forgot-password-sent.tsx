"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";

type ForgotPasswordSentProps = {
    maskedEmail: string | null;
};

export function ForgotPasswordSent({ maskedEmail }: ForgotPasswordSentProps) {
    useRedirectIfAuthenticated("/dashboard");

    return (
        <div className="mc-panel rounded-md p-8 bg-card text-center">
            <div className="mc-block bg-diamond w-14 h-14 mx-auto mb-5 grid place-items-center">
                <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-pixel text-base">CHECK YOUR INBOX</h1>
            <p className="font-mc text-lg text-muted-foreground mt-3">
                If an account exists for
                {maskedEmail ? (
                    <>
                        {" "}
                        <span className="text-foreground font-medium">{maskedEmail}</span>
                    </>
                ) : (
                    " that email"
                )}
                , we&apos;ve sent a password reset link. Click it to set a new password.
            </p>
            <p className="font-mc text-base text-muted-foreground mt-3">
                The link will expire in 30 minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <Link href="/login" className="inline-block mt-6">
                <button className="mc-block mc-block-stone bg-stone h-10 px-5 font-pixel text-[10px]">
                    BACK TO LOGIN
                </button>
            </Link>
        </div>
    );
}
