"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";

import { cn } from "~/lib/utils";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useResetPassword } from "~/hooks/api/auth";
import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";
import { userErrorMessage } from "~/lib/user-error";

type ResetPasswordFormProps = React.ComponentProps<"div"> & {
    token: string | null;
};

type ResetPasswordFormValues = {
    password: string;
    confirmPassword: string;
};

// Mirrors the server-side passwordSchema in packages/services/user/model.ts.
// Kept client-side so we can give immediate feedback without a round-trip.
const validatePassword = (value: string): string | true => {
    if (value.length < 8) return "Minimum 8 characters";
    if (value.length > 128) return "Maximum 128 characters";
    if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter";
    if (!/[a-z]/.test(value)) return "Must contain at least one lowercase letter";
    if (!/[0-9]/.test(value)) return "Must contain at least one number";
    if (!/[!@#$%^&*]/.test(value)) return "Must contain at least one special character";
    return true;
};

export function ResetPasswordForm({ className, token, ...props }: ResetPasswordFormProps) {
    const router = useRouter();
    useRedirectIfAuthenticated("/dashboard");

    const { resetPasswordAsync, error: resetError, isSuccess } = useResetPassword();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormValues>({
        defaultValues: { password: "", confirmPassword: "" },
        mode: "onBlur",
    });

    const passwordValue = watch("password");

    const onSubmit = async (values: ResetPasswordFormValues) => {
        if (!token) return;
        await resetPasswordAsync({
            token,
            password: values.password,
            confirmPassword: values.confirmPassword,
        });
        router.replace("/login");
    };

    if (!token) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <div className="mc-panel rounded-md p-8 bg-card text-center">
                    <div className="mc-block bg-redstone w-14 h-14 mx-auto mb-5 grid place-items-center">
                        <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="font-pixel text-base">INVALID RESET LINK</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-3">
                        This password reset link is missing a token. Please use the link from your
                        email exactly as it was sent, or request a new one.
                    </p>
                    <Link href="/forgot-password" className="inline-block mt-6">
                        <button className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px]">
                            REQUEST A NEW LINK
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <div className="mc-panel rounded-md p-8 bg-card text-center">
                    <div className="mc-block bg-grass w-14 h-14 mx-auto mb-5 grid place-items-center">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="font-pixel text-base">PASSWORD UPDATED</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-3">
                        Your password has been reset. You can now sign in with your new password.
                    </p>
                    <Link href="/login" className="inline-block mt-6">
                        <button className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px]">
                            CONTINUE TO LOGIN
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="mc-panel rounded-md p-6 md:p-8 bg-card">
                <div className="text-center mb-6">
                    <div className="mc-block bg-gold w-12 h-12 mx-auto mb-4 grid place-items-center">
                        <KeyRound className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="font-pixel text-base">SET A NEW PASSWORD</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-2">
                        Pick a strong password you haven&apos;t used on BlockForms before.
                    </p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="password" className="font-mc text-base">
                                New password
                            </FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                {...register("password", {
                                    required: "Password is required",
                                    validate: validatePassword,
                                })}
                            />
                            <FieldDescription className="font-mc text-sm">
                                Must be at least 8 characters and include uppercase, lowercase, a
                                number, and a special character (!@#$%^&amp;*).
                            </FieldDescription>
                            {errors.password && (
                                <FieldDescription className="font-mc text-sm text-destructive">
                                    {errors.password.message}
                                </FieldDescription>
                            )}
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="confirmPassword" className="font-mc text-base">
                                Confirm new password
                            </FieldLabel>
                            <Input
                                id="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                {...register("confirmPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) =>
                                        value === passwordValue || "Passwords do not match",
                                })}
                            />
                            {errors.confirmPassword && (
                                <FieldDescription className="font-mc text-sm text-destructive">
                                    {errors.confirmPassword.message}
                                </FieldDescription>
                            )}
                        </Field>
                        <Field>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="mc-block bg-grass text-primary-foreground h-11 w-full font-pixel text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
                            </button>
                        </Field>
                        {resetError && (
                            <FieldDescription className="font-mc text-base text-destructive text-center">
                                {userErrorMessage(
                                    resetError,
                                    "Something went wrong while resetting your password.",
                                )}
                            </FieldDescription>
                        )}
                        <FieldDescription className="font-mc text-base text-center">
                            Remembered your password?{" "}
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
