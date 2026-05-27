import { and, db, eq, gt } from "@repo/database";
import { usersTable } from "@repo/database/models/user";

import {
    type CreateUserWithEmailAndPasswordInputType,
    type RequestPasswordResetInputType,
    type ResetPasswordInputType,
    type SignInUserWithEmailAndPasswordInputType,
    type ResendVerificationEmailInputType,
    type VerifyEmailInputType,
    type UpdateProfileInputType,
    createUserWithEmailAndPasswordInput,
    requestPasswordResetInput,
    resendVerificationEmailInput,
    resetPasswordInput,
    signInUserWithEmailAndPasswordInput,
    verifyEmailInput,
    updateProfileInput,
} from "./model";
import { resolveProfileAvatarId } from "../profile-avatars";
import {
    generateTokenAndHashedTokenPair,
    generateUserAccessToken,
    generateUserRefreshToken,
    hashToken,
} from "../utils/token-utils";
import {
    GenerateUserAccessTokenPayloadType,
    GenerateUserRefreshTokenPayloadType,
} from "../user/model";
import * as JWT from "jsonwebtoken";
import { maskEmail, sendPasswordResetEmail, sendVerificationEmail } from "../utils/email-utils";
import { generateSalt, hashPassword, verifyPassword } from "../utils/password-utils";
import { env } from "../env";

const VERIFICATION_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

const buildVerificationUrl = (token: string) =>
    `${env.APP_BASE_URL.replace(/\/+$/, "")}/verify-email?token=${encodeURIComponent(token)}`;

const buildPasswordResetUrl = (token: string) =>
    `${env.APP_BASE_URL.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

class UserService {
    private async getUserByEmail(email: string) {
        const result = await db.select().from(usersTable).where(eq(usersTable.email, email));
        if (!result || result.length === 0) return null;
        return result[0];
    }

    /**
     * Generates a fresh verification token, persists its hash + expiry on the user,
     * and sends the verification email. Returns the masked email so callers can
     * surface "we sent a link to ex****@gmail.com" UI.
     */
    private async issueVerificationEmail(user: { id: string; email: string; fullName: string }) {
        const { token, hashedToken } = generateTokenAndHashedTokenPair();

        await db
            .update(usersTable)
            .set({
                verificationToken: hashedToken,
                verificationTokenExpires: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
            })
            .where(eq(usersTable.id, user.id));

        await sendVerificationEmail({
            to: user.email,
            fullName: user.fullName,
            verificationUrl: buildVerificationUrl(token),
        });

        return { maskedEmail: maskEmail(user.email) };
    }

    private async verifyUserToken(
        token: string,
    ): Promise<{ verificationResult: GenerateUserAccessTokenPayloadType }> {
        try {
            const verificationResult = JWT.verify(
                token,
                env.JWT_ACCESS_SECRET,
            ) as GenerateUserAccessTokenPayloadType;
            return { verificationResult };
        } catch (error) {
            throw new Error(`Invalid Token.`);
        }
    }

    public async getUserInfoById(id: string) {
        const user = await db
            .select({
                id: usersTable.id,
                fullName: usersTable.fullName,
                email: usersTable.email,
                profileImageUrl: usersTable.profileImageUrl,
                emailVerified: usersTable.emailVerified,
            })
            .from(usersTable)
            .where(eq(usersTable.id, id));

        if (!user || user.length === 0) throw new Error(`User with ID ${id} doesn't exist.`);
        return user[0]!;
    }

    public async createUserWithEmailAndPassword(payload: CreateUserWithEmailAndPasswordInputType) {
        const { fullName, email, password } =
            await createUserWithEmailAndPasswordInput.parseAsync(payload);

        // Check if user exists
        const existingUser = await this.getUserByEmail(email);
        if (existingUser) throw new Error(`User with email ${email} already exists.`);

        const salt = generateSalt();
        const hashedPassword = hashPassword(salt, password);

        const userInsertResult = await db
            .insert(usersTable)
            .values({ fullName, email, password: hashedPassword, salt })
            .returning({
                id: usersTable.id,
                email: usersTable.email,
                fullName: usersTable.fullName,
                emailVerified: usersTable.emailVerified,
            });

        if (!userInsertResult || userInsertResult.length === 0 || !userInsertResult[0]?.id)
            throw new Error("something went wrong when creating the user.");

        const newUser = userInsertResult[0];
        const { accessToken } = await generateUserAccessToken({
            id: newUser.id,
            email: newUser.email,
            fullName: newUser.fullName,
            emailVerified: Boolean(newUser.emailVerified),
        });

        const { refreshToken } = await generateUserRefreshToken({
            id: newUser.id,
        });

        const hashedRefreshToken = hashToken(refreshToken);

        const refreshTokenUpdateResult = await db
            .update(usersTable)
            .set({ refreshToken: hashedRefreshToken })
            .where(eq(usersTable.id, newUser.id))
            .returning({ refreshTokenUpdated: usersTable.refreshToken });

        if (
            !refreshTokenUpdateResult ||
            refreshTokenUpdateResult.length === 0 ||
            !refreshTokenUpdateResult[0]?.refreshTokenUpdated
        )
            throw new Error("something went wrong when creating the user.");

        const { maskedEmail } = await this.issueVerificationEmail(newUser);

        return {
            id: newUser.id,
            accessToken,
            refreshToken,
            emailVerified: false,
            maskedEmail,
        };
    }

    public async signInUserWithEmailAndPassword(payload: SignInUserWithEmailAndPasswordInputType) {
        const { email, password } = await signInUserWithEmailAndPasswordInput.parseAsync(payload);

        const existingUser = await this.getUserByEmail(email);

        if (!existingUser) throw new Error(`Invalid Email or Password.`);

        if (!existingUser.password || !existingUser.salt)
            throw new Error(`Invalid authentication method.`);

        if (!verifyPassword(existingUser.salt, existingUser.password, password)) {
            throw new Error(`Invalid Email or Password.`);
        }

        const { accessToken } = await generateUserAccessToken({
            id: existingUser.id,
            email: existingUser.email,
            fullName: existingUser.fullName,
            emailVerified: Boolean(existingUser.emailVerified),
        });

        const { refreshToken } = await generateUserRefreshToken({
            id: existingUser.id,
        });

        await db
            .update(usersTable)
            .set({ refreshToken: hashToken(refreshToken) })
            .where(eq(usersTable.id, existingUser.id));

        return {
            id: existingUser.id,
            accessToken,
            refreshToken,
            emailVerified: Boolean(existingUser.emailVerified),
            maskedEmail: maskEmail(existingUser.email),
        };
    }

    /**
     * Verifies a refresh token (JWT signature + DB hash match) and, if valid,
     * issues a brand-new access/refresh token pair and rotates the stored hash.
     * Throws error if the token is missing, tampered with, expired, or no longer
     * matches what's in the DB
     */
    public async refreshSession(refreshToken: string | undefined | null) {
        if (!refreshToken) throw new Error("Missing refresh token.");

        let decoded: GenerateUserRefreshTokenPayloadType;
        try {
            decoded = JWT.verify(
                refreshToken,
                env.JWT_REFRESH_SECRET,
            ) as GenerateUserRefreshTokenPayloadType;
        } catch {
            throw new Error("Invalid or expired refresh token.");
        }

        const hashedRefreshToken = hashToken(refreshToken);

        const result = await db
            .select({
                id: usersTable.id,
                email: usersTable.email,
                fullName: usersTable.fullName,
                emailVerified: usersTable.emailVerified,
                profileImageUrl: usersTable.profileImageUrl,
                storedRefreshToken: usersTable.refreshToken,
            })
            .from(usersTable)
            .where(eq(usersTable.id, decoded.id));

        const user = result?.[0];
        if (!user || !user.storedRefreshToken || user.storedRefreshToken !== hashedRefreshToken) {
            throw new Error("Refresh token is no longer valid.");
        }

        const { accessToken: newAccessToken } = await generateUserAccessToken({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            emailVerified: Boolean(user.emailVerified),
        });

        const { refreshToken: newRefreshToken } = await generateUserRefreshToken({
            id: user.id,
        });

        await db
            .update(usersTable)
            .set({ refreshToken: hashToken(newRefreshToken) })
            .where(eq(usersTable.id, user.id));

        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            emailVerified: Boolean(user.emailVerified),
            profileImageUrl: user.profileImageUrl,
            newAccessToken,
            newRefreshToken,
        };
    }

    /**
     * Consumes a verification token: if it matches a user and hasn't expired,
     * the user is marked as verified and the token is cleared.
     */
    public async verifyEmail(payload: VerifyEmailInputType) {
        const { token } = await verifyEmailInput.parseAsync(payload);

        const hashedToken = hashToken(token);

        const result = await db
            .select({
                id: usersTable.id,
                email: usersTable.email,
                emailVerified: usersTable.emailVerified,
            })
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.verificationToken, hashedToken),
                    gt(usersTable.verificationTokenExpires, new Date()),
                ),
            );

        const user = result?.[0];
        if (!user) {
            throw new Error("Verification link is invalid or has expired.");
        }

        if (user.emailVerified) {
            return { id: user.id, alreadyVerified: true as const };
        }

        await db
            .update(usersTable)
            .set({
                emailVerified: true,
                verificationToken: null,
                verificationTokenExpires: null,
            })
            .where(eq(usersTable.id, user.id));

        return { id: user.id, alreadyVerified: false as const };
    }

    /**
     * Issues a fresh verification link for an unverified user. Returns a masked
     * email even when the account doesn't exist / is already verified so that
     * we don't leak which addresses are registered.
     */
    public async resendVerificationEmail(payload: ResendVerificationEmailInputType) {
        const { email } = await resendVerificationEmailInput.parseAsync(payload);

        const user = await this.getUserByEmail(email);

        if (!user || user.emailVerified) {
            return { maskedEmail: maskEmail(email), sent: false as const };
        }

        await this.issueVerificationEmail({
            id: user.id,
            email: user.email,
            fullName: user.fullName,
        });

        return { maskedEmail: maskEmail(user.email), sent: true as const };
    }

    public async verifyAndDecodeUserToken(token: string) {
        const { verificationResult } = await this.verifyUserToken(token);
        return { verificationResult };
    }

    /**
     * Generates a fresh password-reset token, persists its hash + expiry on the
     * user, and emails them a reset link. Always returns a masked email — even
     * when the address is not registered, so we don't leak which addresses
     * have accounts.
     */
    public async requestPasswordReset(payload: RequestPasswordResetInputType) {
        const { email } = await requestPasswordResetInput.parseAsync(payload);

        const user = await this.getUserByEmail(email);

        if (!user || !user.password || !user.salt) {
            return { maskedEmail: maskEmail(email), sent: false as const };
        }

        const { token, hashedToken } = generateTokenAndHashedTokenPair();

        await db
            .update(usersTable)
            .set({
                resetPasswordToken: hashedToken,
                resetPasswordTokenExpires: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
            })
            .where(eq(usersTable.id, user.id));

        await sendPasswordResetEmail({
            to: user.email,
            fullName: user.fullName,
            resetUrl: buildPasswordResetUrl(token),
        });

        return { maskedEmail: maskEmail(user.email), sent: true as const };
    }

    /**
     * Consumes a password-reset token: if it matches a user and hasn't expired,
     * the user's password is rotated (new salt + hash), the reset token is
     * cleared, and any existing refresh tokens are invalidated so other devices
     * have to sign in again with the new password.
     */
    public async resetPassword(payload: ResetPasswordInputType) {
        const { token, password, confirmPassword } = await resetPasswordInput.parseAsync(payload);

        if (password !== confirmPassword) {
            throw new Error("Passwords don't match.");
        }

        const hashedToken = hashToken(token);

        const result = await db
            .select({
                id: usersTable.id,
                email: usersTable.email,
            })
            .from(usersTable)
            .where(
                and(
                    eq(usersTable.resetPasswordToken, hashedToken),
                    gt(usersTable.resetPasswordTokenExpires, new Date()),
                ),
            );

        const user = result?.[0];
        if (!user) {
            throw new Error("Password reset link is invalid or has expired.");
        }

        const salt = generateSalt();
        const hashedPassword = hashPassword(salt, password);

        await db
            .update(usersTable)
            .set({
                password: hashedPassword,
                salt,
                resetPasswordToken: null,
                resetPasswordTokenExpires: null,
                refreshToken: null,
            })
            .where(eq(usersTable.id, user.id));

        return { id: user.id, maskedEmail: maskEmail(user.email) };
    }

    public async updateProfile(userId: string, payload: UpdateProfileInputType) {
        const { fullName, profileAvatarId } = await updateProfileInput.parseAsync(payload);

        const normalizedImageUrl = resolveProfileAvatarId(profileAvatarId);

        await db
            .update(usersTable)
            .set({
                fullName,
                ...(normalizedImageUrl !== undefined
                    ? { profileImageUrl: normalizedImageUrl }
                    : {}),
            })
            .where(eq(usersTable.id, userId));

        return this.getUserInfoById(userId);
    }
}

export default UserService;
