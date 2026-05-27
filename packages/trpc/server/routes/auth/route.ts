import { TRPCError } from "@trpc/server";

import { publicProcedure, router, authenticatedProcedure, authPublicProcedure } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
    createUserWithEmailAndPasswordInputModel,
    createUserWithEmailAndPasswordOutputModel,
    getLoggedInUserInfoInputModel,
    getLoggedInUserInfoOutputModel,
    refreshSessionInputModel,
    refreshSessionOutputModel,
    updateProfileInputModel,
    updateProfileOutputModel,
    signOutInputModel,
    signOutOutputModel,
    requestPasswordResetInputModel,
    requestPasswordResetOutputModel,
    resendVerificationEmailInputModel,
    resendVerificationEmailOutputModel,
    resetPasswordInputModel,
    resetPasswordOutputModel,
    signInUserWithEmailAndPasswordInputModel,
    signInUserWithEmailAndPasswordOutputModel,
    verifyEmailInputModel,
    verifyEmailOutputModel,
} from "./model";
import { userService } from "../../services";
import { toPublicTRPCError } from "../../utils/public-error";
import {
    clearAuthTokenCookies,
    getAccessTokenCookie,
    getRefreshTokenCookie,
    setAccessTokenCookie,
    setRefreshTokenCookie,
} from "../../utils/cookie";

const TAGS = ["Authentication"];
const getPath = generatePath("/authentication");

export const authRouter = router({
    createUserWithEmailAndPassword: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/createUserWithEmailAndPassword"),
                tags: TAGS,
            },
        })
        .input(createUserWithEmailAndPasswordInputModel)
        .output(createUserWithEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { fullName, email, password, confirmPassword } = input;
            if (password !== confirmPassword) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Passwords don't match",
                });
            }
            try {
                const { id, accessToken, refreshToken, emailVerified, maskedEmail } =
                    await userService.createUserWithEmailAndPassword({
                        fullName,
                        email,
                        password,
                        confirmPassword,
                    });

                setAccessTokenCookie(ctx, accessToken);
                setRefreshTokenCookie(ctx, refreshToken);

                return {
                    id,
                    emailVerified,
                    maskedEmail,
                };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while creating your account.",
                    {
                        path: "auth.createUserWithEmailAndPassword",
                    },
                );
            }
        }),

    signInUserWithEmailAndPassword: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signinUserWithEmailAndPassword"),
                tags: TAGS,
            },
        })
        .input(signInUserWithEmailAndPasswordInputModel)
        .output(signInUserWithEmailAndPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { email, password } = input;
            try {
                const { id, accessToken, refreshToken, emailVerified, maskedEmail } =
                    await userService.signInUserWithEmailAndPassword({ email, password });

                setAccessTokenCookie(ctx, accessToken);
                setRefreshTokenCookie(ctx, refreshToken);

                return {
                    id,
                    emailVerified,
                    maskedEmail,
                };
            } catch (error) {
                throw toPublicTRPCError(error, "Something went wrong while signing in.", {
                    path: "auth.signInUserWithEmailAndPassword",
                });
            }
        }),

    verifyEmail: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/verifyEmail"),
                tags: TAGS,
            },
        })
        .input(verifyEmailInputModel)
        .output(verifyEmailOutputModel)
        .mutation(async ({ input }) => {
            try {
                const { id, alreadyVerified } = await userService.verifyEmail({
                    token: input.token,
                });
                return { id, alreadyVerified };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "This verification link is invalid or has expired.",
                    { path: "auth.verifyEmail", code: "BAD_REQUEST" },
                );
            }
        }),

    resendVerificationEmail: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/resendVerificationEmail"),
                tags: TAGS,
            },
        })
        .input(resendVerificationEmailInputModel)
        .output(resendVerificationEmailOutputModel)
        .mutation(async ({ input }) => {
            try {
                const { maskedEmail } = await userService.resendVerificationEmail({
                    email: input.email,
                });
                return { maskedEmail };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while sending the verification email.",
                    { path: "auth.resendVerificationEmail" },
                );
            }
        }),

    requestPasswordReset: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/requestPasswordReset"),
                tags: TAGS,
            },
        })
        .input(requestPasswordResetInputModel)
        .output(requestPasswordResetOutputModel)
        .mutation(async ({ input }) => {
            try {
                const { maskedEmail } = await userService.requestPasswordReset({
                    email: input.email,
                });
                return { maskedEmail };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while requesting a password reset.",
                    { path: "auth.requestPasswordReset" },
                );
            }
        }),

    resetPassword: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/resetPassword"),
                tags: TAGS,
            },
        })
        .input(resetPasswordInputModel)
        .output(resetPasswordOutputModel)
        .mutation(async ({ input, ctx }) => {
            const { token, password, confirmPassword } = input;
            if (password !== confirmPassword) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Passwords don't match.",
                });
            }
            try {
                const { id, maskedEmail } = await userService.resetPassword({
                    token,
                    password,
                    confirmPassword,
                });

                // Resetting the password invalidates any existing sessions, so
                // clear cookies for whoever was signed in on this device too.
                clearAuthTokenCookies(ctx);

                return { id, maskedEmail };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "This password reset link is invalid or has expired.",
                    { path: "auth.resetPassword", code: "BAD_REQUEST" },
                );
            }
        }),

    getLoggedInUserInfo: authenticatedProcedure
        .meta({
            openapi: {
                method: "GET",
                path: getPath("/getLoggedInUserInfo"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(getLoggedInUserInfoInputModel)
        .output(getLoggedInUserInfoOutputModel)
        .query(async ({ ctx }) => {
            const { id, fullName, email, emailVerified, profileImageUrl } =
                await userService.getUserInfoById(ctx.user.id);
            return { id, fullName, email, emailVerified: Boolean(emailVerified), profileImageUrl };
        }),

    refreshSession: authPublicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/refreshSession"),
                tags: TAGS,
            },
        })
        .input(refreshSessionInputModel)
        .output(refreshSessionOutputModel)
        .mutation(async ({ ctx }) => {
            const refreshToken = getRefreshTokenCookie(ctx);
            try {
                const {
                    id,
                    fullName,
                    email,
                    emailVerified,
                    profileImageUrl,
                    newAccessToken,
                    newRefreshToken,
                } = await userService.refreshSession(refreshToken);

                setAccessTokenCookie(ctx, newAccessToken);
                setRefreshTokenCookie(ctx, newRefreshToken);

                return { id, fullName, email, emailVerified, profileImageUrl };
            } catch (error) {
                clearAuthTokenCookies(ctx);
                throw toPublicTRPCError(error, "Your session has expired. Please sign in again.", {
                    path: "auth.refreshSession",
                    code: "UNAUTHORIZED",
                });
            }
        }),

    updateProfile: authenticatedProcedure
        .meta({
            openapi: {
                method: "PATCH",
                path: getPath("/updateProfile"),
                tags: TAGS,
                protect: true,
            },
        })
        .input(updateProfileInputModel)
        .output(updateProfileOutputModel)
        .mutation(async ({ ctx, input }) => {
            try {
                const updated = await userService.updateProfile(ctx.user.id, input);
                return {
                    id: updated.id,
                    fullName: updated.fullName,
                    email: updated.email,
                    emailVerified: Boolean(updated.emailVerified),
                    profileImageUrl: updated.profileImageUrl ?? null,
                };
            } catch (error) {
                throw toPublicTRPCError(
                    error,
                    "Something went wrong while updating your profile.",
                    {
                        path: "auth.updateProfile",
                        code: "BAD_REQUEST",
                    },
                );
            }
        }),

    signOut: publicProcedure
        .meta({
            openapi: {
                method: "POST",
                path: getPath("/signOut"),
                tags: TAGS,
            },
        })
        .input(signOutInputModel)
        .output(signOutOutputModel)
        .mutation(async ({ ctx }) => {
            clearAuthTokenCookies(ctx);
            return { success: true as const };
        }),
});
