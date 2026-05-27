import { z } from "zod";

import { profileAvatarIdInputSchema } from "../profile-avatars";

const passwordSchema = z
    .string()
    .min(8, "Minimum 8 characters")
    .max(128, "Maximum 128 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character");

export const createUserWithEmailAndPasswordInput = z.object({
    fullName: z.string().describe("Full name of the user"),
    email: z.email().describe("Email of the user"),
    password: passwordSchema.describe("Password of the user"),
    confirmPassword: z.string().describe("Confirm password of the user"),
});

export type CreateUserWithEmailAndPasswordInputType = z.infer<
    typeof createUserWithEmailAndPasswordInput
>;

export const signInUserWithEmailAndPasswordInput = z.object({
    email: z.email().describe("Email of the user"),
    password: passwordSchema.describe("Password of the user"),
});

export type SignInUserWithEmailAndPasswordInputType = z.infer<
    typeof signInUserWithEmailAndPasswordInput
>;

export const generateUserAccessTokenPayload = z.object({
    id: z.string().describe("uuid of the user"),
    email: z.email().describe("Email of the user"),
    fullName: z.string().describe("Full name of the user"),
    emailVerified: z.boolean().describe("Whether the user's email is verified"),
});

export type GenerateUserAccessTokenPayloadType = z.infer<typeof generateUserAccessTokenPayload>;

export const generateUserRefreshTokenPayload = z.object({
    id: z.string().describe("uuid of the user"),
});

export type GenerateUserRefreshTokenPayloadType = z.infer<typeof generateUserRefreshTokenPayload>;

export const verifyEmailInput = z.object({
    token: z
        .string()
        .min(1, "Verification token is required")
        .describe("Plain-text verification token from the email link"),
});

export type VerifyEmailInputType = z.infer<typeof verifyEmailInput>;

export const resendVerificationEmailInput = z.object({
    email: z.email().describe("Email of the user requesting a new verification link"),
});

export type ResendVerificationEmailInputType = z.infer<typeof resendVerificationEmailInput>;

export const requestPasswordResetInput = z.object({
    email: z.email().describe("Email of the user requesting a password reset"),
});

export type RequestPasswordResetInputType = z.infer<typeof requestPasswordResetInput>;

export const resetPasswordInput = z.object({
    token: z
        .string()
        .min(1, "Reset token is required")
        .describe("Plain-text password-reset token from the email link"),
    password: passwordSchema.describe("New password"),
    confirmPassword: z.string().describe("Confirmation of the new password"),
});

export type ResetPasswordInputType = z.infer<typeof resetPasswordInput>;

export const updateProfileInput = z.object({
    fullName: z.string().trim().min(1, "Full name is required").max(80, "Maximum 80 characters"),
    profileAvatarId: profileAvatarIdInputSchema.optional().nullable(),
});

export type UpdateProfileInputType = z.infer<typeof updateProfileInput>;
