"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Pickaxe } from "lucide-react";

import { cn } from "~/lib/utils";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { useResendVerificationEmail, useSignIn } from "~/hooks/api/auth";
import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";
import { userErrorMessage } from "~/lib/user-error";

type LoginFormValues = {
    email: string;
    password: string;
};

type UnverifiedState = {
    email: string;
    maskedEmail: string;
};

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirect") || "/dashboard";
    useRedirectIfAuthenticated(redirectTo);

    const { signInUserWithEmailAndPasswordAsync, error: signInError } = useSignIn();
    const { resendVerificationEmailAsync, isPending: isResending } = useResendVerificationEmail();

    const [unverified, setUnverified] = useState<UnverifiedState | null>(null);

    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<LoginFormValues>({
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (values: LoginFormValues) => {
        setUnverified(null);
        const result = await signInUserWithEmailAndPasswordAsync({
            email: values.email,
            password: values.password,
        });

        if (!result.emailVerified) {
            setUnverified({ email: values.email, maskedEmail: result.maskedEmail });
            return;
        }

        router.replace(redirectTo);
    };

    const onProceedWithVerification = async () => {
        if (!unverified) return;
        const { maskedEmail } = await resendVerificationEmailAsync({
            email: unverified.email,
        });
        router.push(`/verify-email/sent?email=${encodeURIComponent(maskedEmail)}`);
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="mc-panel rounded-md overflow-hidden bg-card">
                <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="mc-block bg-grass mb-2 grid h-12 w-12 place-items-center">
                                <Pickaxe className="h-6 w-6 text-white/90" />
                            </div>
                            <h1 className="font-pixel text-base">WELCOME BACK</h1>
                            <p className="font-mc text-lg text-muted-foreground">
                                Log in to your BlockForms workshop.
                            </p>
                        </div>
                        <Field>
                                <FieldLabel htmlFor="email" className="font-mc text-base">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="steve@example.com"
                                    required
                                    {...register("email", { required: true })}
                                />
                            </Field>
                            <Field>
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password" className="font-mc text-base">
                                        Password
                                    </FieldLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="ml-auto font-mc text-sm text-primary underline underline-offset-2 hover:opacity-80"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="password"
                                    required
                                    autoComplete="current-password"
                                    {...register("password", { required: true })}
                                />
                            </Field>
                            <Field>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mc-block bg-grass text-primary-foreground h-11 w-full font-pixel text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "SIGNING IN..." : "LOG IN"}
                                </button>
                            </Field>
                            {signInError && !unverified && (
                                <FieldDescription className="font-mc text-base text-destructive text-center">
                                    {userErrorMessage(
                                        signInError,
                                        "Something went wrong while signing in.",
                                    )}
                                </FieldDescription>
                            )}
                            {unverified && (
                                <Field className="gap-3 mc-panel rounded-md p-4 bg-card">
                                    <FieldDescription className="font-mc text-base text-center">
                                        Your account hasn&apos;t been verified yet. Verify your
                                        email to continue.
                                    </FieldDescription>
                                    <button
                                        type="button"
                                        onClick={onProceedWithVerification}
                                        disabled={isResending}
                                        className="mc-block mc-block-stone bg-stone h-10 font-pixel text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isResending
                                            ? "SENDING LINK..."
                                            : "PROCEED WITH VERIFICATION"}
                                    </button>
                                </Field>
                            )}
                        <FieldDescription className="font-mc text-base text-center">
                            New here?{" "}
                            <Link
                                href="/signup"
                                className="text-primary underline underline-offset-2"
                            >
                                Sign up
                            </Link>
                        </FieldDescription>
                    </FieldGroup>
                </form>
                <div className="h-4 bg-grass-block" aria-hidden />
            </div>
            <FieldDescription className="font-mc text-base px-6 text-center">
                By clicking continue, you agree to our{" "}
                <Link href="/terms" className="text-primary underline underline-offset-2">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary underline underline-offset-2">
                    Privacy Policy
                </Link>
                .
            </FieldDescription>
        </div>
    );
}
