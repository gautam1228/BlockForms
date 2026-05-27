"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { cn } from "~/lib/utils";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useRequestPasswordReset } from "~/hooks/api/auth";
import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";
import { userErrorMessage } from "~/lib/user-error";

type ForgotPasswordFormValues = {
    email: string;
};

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();
    useRedirectIfAuthenticated("/dashboard");

    const { requestPasswordResetAsync, error } = useRequestPasswordReset();

    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<ForgotPasswordFormValues>({
        defaultValues: { email: "" },
    });

    const onSubmit = async (values: ForgotPasswordFormValues) => {
        const result = await requestPasswordResetAsync({ email: values.email });
        router.push(`/forgot-password/sent?email=${encodeURIComponent(result.maskedEmail)}`);
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="mc-panel rounded-md p-6 md:p-8 bg-card">
                <div className="text-center mb-6">
                    <div className="mc-block bg-redstone w-12 h-12 mx-auto mb-4" />
                    <h1 className="font-pixel text-base">FORGOT PASSWORD?</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-2">
                        Enter the email associated with your account and we&apos;ll send you a link
                        to reset it.
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="email" className="font-mc text-base">
                                Email
                            </FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                autoComplete="email"
                                {...register("email", { required: true })}
                            />
                            <FieldDescription className="font-mc text-sm">
                                We&apos;ll only use this to send your password reset link.
                            </FieldDescription>
                        </Field>
                        <Field>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mc-block bg-grass text-primary-foreground h-11 w-full font-pixel text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "SENDING LINK..." : "SEND RESET LINK"}
                            </button>
                        </Field>
                        {error && (
                            <FieldDescription className="font-mc text-base text-destructive text-center">
                                {userErrorMessage(
                                    error,
                                    "Something went wrong while sending the reset email.",
                                )}
                            </FieldDescription>
                        )}
                        <FieldDescription className="font-mc text-base text-center">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="text-primary underline underline-offset-2"
                            >
                                Back to login
                            </Link>
                        </FieldDescription>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
}
