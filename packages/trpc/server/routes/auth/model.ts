import { z } from "zod";

import { profileAvatarIdInputSchema } from "@repo/services/profile-avatars";

const passwordSchema = z
    .string()
    .min(8, "Minimum 8 characters")
    .max(128, "Maximum 128 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[!@#$%^&*]/, "Must contain at least one special character");

// NOTE: Keep this as a plain ZodObject (no `.refine()`), because
// `trpc-to-openapi` calls `.omit()` on input schemas internally, and
// `.omit()` is not available on `ZodEffects` (the type returned by `.refine()`).
// Cross-field validation (e.g. password === confirmPassword) is enforced
// in the route handler instead.
export const createUserWithEmailAndPasswordInputModel = z.object({
    fullName: z.string().describe("Full name of the user"),
    email: z.email().describe("Email of the user"),
    password: passwordSchema.describe("Password of the user"),
    confirmPassword: z.string().describe("Confirm password of the user"),
});

export const createUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe("ID of the user created"),
    emailVerified: z.boolean().describe("Whether the user's email is already verified"),
    maskedEmail: z.string().describe("Masked version of the email a verification link was sent to"),
});

export const signInUserWithEmailAndPasswordInputModel = z.object({
    email: z.email().describe("Email of the user"),
    password: passwordSchema.describe("Password of the user"),
});

export const signInUserWithEmailAndPasswordOutputModel = z.object({
    id: z.string().describe("ID of the user created"),
    emailVerified: z.boolean().describe("Whether the user's email is already verified"),
    maskedEmail: z.string().describe("Masked version of the user's email for display"),
});

export const verifyEmailInputModel = z.object({
    token: z.string().min(1).describe("Plain-text verification token from the email link"),
});

export const verifyEmailOutputModel = z.object({
    id: z.string().describe("ID of the verified user"),
    alreadyVerified: z
        .boolean()
        .describe("True if the user was already verified before this request"),
});

export const resendVerificationEmailInputModel = z.object({
    email: z.email().describe("Email of the user requesting a new verification link"),
});

export const resendVerificationEmailOutputModel = z.object({
    maskedEmail: z.string().describe("Masked version of the email a link was sent to"),
});

export const getLoggedInUserInfoInputModel = z.undefined();
export const getLoggedInUserInfoOutputModel = z.object({
    id: z.string().describe("ID of the user"),
    fullName: z.string().describe("Full name of the user"),
    email: z.string().describe("Email of the user"),
    emailVerified: z.boolean().default(false).describe("Whether the user's email is verified"),
    profileImageUrl: z.string().describe("Profile Image URL of the user").optional().nullable(),
});

export const requestPasswordResetInputModel = z.object({
    email: z.email().describe("Email of the user requesting a password reset"),
});

export const requestPasswordResetOutputModel = z.object({
    maskedEmail: z
        .string()
        .describe("Masked version of the email a password-reset link was sent to"),
});

export const resetPasswordInputModel = z.object({
    token: z.string().min(1).describe("Plain-text password-reset token from the email link"),
    password: passwordSchema.describe("New password"),
    confirmPassword: z.string().describe("Confirmation of the new password"),
});

export const resetPasswordOutputModel = z.object({
    id: z.string().describe("ID of the user whose password was reset"),
    maskedEmail: z.string().describe("Masked email of the user whose password was reset"),
});

export const refreshSessionInputModel = z.object({});
export const refreshSessionOutputModel = z.object({
    id: z.string().describe("ID of the user"),
    fullName: z.string().describe("Full name of the user"),
    email: z.string().describe("Email of the user"),
    emailVerified: z.boolean().default(false).describe("Whether the user's email is verified"),
    profileImageUrl: z.string().describe("Profile Image URL of the user").optional().nullable(),
});

export const updateProfileInputModel = z.object({
    fullName: z.string().trim().min(1, "Full name is required").max(80, "Maximum 80 characters"),
    profileAvatarId: profileAvatarIdInputSchema.optional().nullable(),
});

export const updateProfileOutputModel = getLoggedInUserInfoOutputModel;

export const signOutInputModel = z.object({});
export const signOutOutputModel = z.object({
    success: z.literal(true),
});
