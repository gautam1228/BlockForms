"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";

type VerifyEmailSentProps = {
    maskedEmail: string | null;
};

export function VerifyEmailSent({ maskedEmail }: VerifyEmailSentProps) {
    useRedirectIfAuthenticated("/dashboard");

    return (
        <div className="mc-panel rounded-md p-8 bg-card text-center">
            <div className="mc-block bg-gold w-14 h-14 mx-auto mb-5 grid place-items-center">
                <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-pixel text-base">CHECK YOUR INBOX</h1>
            <p className="font-mc text-lg text-muted-foreground mt-3">
                We&apos;ve sent a verification link
                {maskedEmail ? (
                    <>
                        {" "}
                        to <span className="text-foreground font-medium">{maskedEmail}</span>
                    </>
                ) : (
                    " to your registered email"
                )}
                . Click the link in the email to verify your account.
            </p>
            <p className="font-mc text-base text-muted-foreground mt-3">
                The link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
            </p>
            <Link href="/login" className="inline-block mt-6">
                <button className="mc-block mc-block-stone bg-stone h-10 px-5 font-pixel text-[10px]">
                    BACK TO LOGIN
                </button>
            </Link>
        </div>
    );
}
