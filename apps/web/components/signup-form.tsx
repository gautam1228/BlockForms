"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { Sparkles } from "lucide-react";

import { cn } from "~/lib/utils";
import { FloatingBlocks } from "~/components/floating-blocks";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { useSignup } from "~/hooks/api/auth";
import { useRedirectIfAuthenticated } from "~/hooks/auth/use-redirect-if-authenticated";
import { userErrorMessage } from "~/lib/user-error";

type SignupFormValues = {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
    const router = useRouter();
    useRedirectIfAuthenticated("/dashboard");

    const { createUserWithEmailAndPasswordAsync, error } = useSignup();
    const {
        register,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm<SignupFormValues>({
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const onSubmit: SubmitHandler<SignupFormValues> = async (values: SignupFormValues) => {
        const result = await createUserWithEmailAndPasswordAsync({
            fullName: values.fullName,
            email: values.email,
            password: values.password,
            confirmPassword: values.confirmPassword,
        });

        router.push(`/verify-email/sent?email=${encodeURIComponent(result.maskedEmail)}`);
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <div className="mc-panel rounded-md overflow-hidden bg-card">
                <div className="grid md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="mc-block bg-gold w-12 h-12 mb-2" />
                                <h1 className="font-pixel text-base">CREATE ACCOUNT</h1>
                                <p className="font-mc text-lg text-muted-foreground">
                                    Start crafting forms in seconds.
                                </p>
                            </div>
                            <Field>
                                <FieldLabel htmlFor="full-name" className="font-mc text-base">
                                    Crafter name
                                </FieldLabel>
                                <Input
                                    id="full-name"
                                    type="text"
                                    placeholder="Steve"
                                    required
                                    {...register("fullName")}
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="email" className="font-mc text-base">
                                    Email
                                </FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="steve@example.com"
                                    required
                                    {...register("email")}
                                />
                                <FieldDescription className="font-mc text-sm">
                                    We&apos;ll use this to contact you. We won&apos;t share your
                                    email with anyone else.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <Field className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel
                                            htmlFor="password"
                                            className="font-mc text-base"
                                        >
                                            Password
                                        </FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            required
                                            {...register("password")}
                                        />
                                    </Field>
                                    <Field>
                                        <FieldLabel
                                            htmlFor="confirm-password"
                                            className="font-mc text-base"
                                        >
                                            Confirm
                                        </FieldLabel>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            required
                                            {...register("confirmPassword")}
                                        />
                                    </Field>
                                </Field>
                                <FieldDescription className="font-mc text-sm">
                                    Must be at least 8 characters long.
                                </FieldDescription>
                            </Field>
                            <Field>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mc-block bg-grass text-primary-foreground h-11 w-full font-pixel text-[10px] disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
                                </button>
                            </Field>
                            {error && (
                                <FieldDescription className="font-mc text-base text-destructive text-center">
                                    {userErrorMessage(
                                        error,
                                        "Something went wrong while creating your account.",
                                    )}
                                </FieldDescription>
                            )}
                            <FieldDescription className="font-mc text-base text-center">
                                Already a crafter?{" "}
                                <Link
                                    href="/login"
                                    className="text-primary underline underline-offset-2"
                                >
                                    Log in
                                </Link>
                            </FieldDescription>
                        </FieldGroup>
                    </form>

                    {/* MC-themed visual panel (replaces the old placeholder.svg) */}
                    <div className="relative hidden bg-mc-sky md:block overflow-hidden">
                        <FloatingBlocks count={10} />
                        <div className="absolute inset-0 grid place-items-center">
                            <div className="animate-mc-float">
                                <div className="w-28 h-28 mc-block bg-gold grid place-items-center">
                                    <Sparkles className="h-10 w-10 text-white/90" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-grass-block" />
                    </div>
                </div>
            </div>
            <FieldDescription className="font-mc text-base px-6 text-center">
                By clicking continue, you agree to our{" "}
                <a href="#" className="text-primary underline underline-offset-2">
                    Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-primary underline underline-offset-2">
                    Privacy Policy
                </a>
                .
            </FieldDescription>
        </div>
    );
}
