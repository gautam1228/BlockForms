import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";

import { logger } from "@repo/logger";

import { emailTransportOptions } from "../config/email";
import { env } from "../env";

let cachedTransporter: Transporter | null = null;

const getTransporter = (): Transporter => {
    if (!cachedTransporter) {
        cachedTransporter = nodemailer.createTransport(emailTransportOptions);
    }
    return cachedTransporter;
};

type SendEmailOptions = Omit<SendMailOptions, "from"> & {
    to: SendMailOptions["to"];
};

export const sendEmail = async (options: SendEmailOptions) => {
    const transporter = getTransporter();

    const mailOptions: SendMailOptions = {
        from: env.SENDER_EMAIL,
        ...options,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent: ${info.messageId}`);
        return { messageId: info.messageId };
    } catch (error) {
        logger.error("Error sending email", error);
        throw error;
    }
};

/**
 * Masks the local part of an email so it can be safely surfaced in the UI
 * without leaking the full address. e.g. `gautam@gmail.com` -> `ga****@gmail.com`.
 */
export const maskEmail = (email: string): string => {
    const atIndex = email.lastIndexOf("@");
    if (atIndex <= 0) return email;

    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex);

    if (local.length <= 2) {
        return `${local[0] ?? ""}*${domain}`;
    }

    const visible = local.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(local.length - 2, 3))}${domain}`;
};

type VerificationEmailParams = {
    to: string;
    fullName: string;
    verificationUrl: string;
};

type PasswordResetEmailParams = {
    to: string;
    fullName: string;
    resetUrl: string;
};

export const sendPasswordResetEmail = async ({
    to,
    fullName,
    resetUrl,
}: PasswordResetEmailParams) => {
    const subject = "Reset your BlockForms password.";

    const text = [
        `Hi ${fullName},`,
        "",
        "We received a request to reset the password on your BlockForms account. Open the link below to set a new password:",
        "",
        resetUrl,
        "",
        "This link will expire in 30 minutes. If you didn't request this, you can safely ignore this email - your password will stay the same.",
    ].join("\n");

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="margin: 0 0 16px;">Reset your password</h2>
            <p>Hi ${fullName},</p>
            <p>We received a request to reset the password on your <strong>BlockForms</strong> account. Click the button below to set a new password.</p>
            <p style="margin: 24px 0;">
                <a
                    href="${resetUrl}"
                    style="display:inline-block;padding:12px 20px;background:#d68582;color:#fafafa;text-decoration:none;border-radius:6px;font-weight:600;"
                >
                    Set a new password
                </a>
            </p>
            <p style="color:#fff7ed;font-size:13px;">
                Or copy and paste this link into your browser:<br/>
                <a href="${resetUrl}">${resetUrl}</a>
            </p>
            <p style="color:#888;font-size:12px;margin-top:32px;">
                This link will expire in 30 minutes. If you didn't request a password reset, you can safely ignore this email.
            </p>
        </div>
    `;

    return sendEmail({ to, subject, text, html });
};

export const sendVerificationEmail = async ({
    to,
    fullName,
    verificationUrl,
}: VerificationEmailParams) => {
    const subject = "Verify your BlockForms account.";

    const text = [
        `Hi ${fullName},`,
        "",
        "Thanks for signing up for BlockForms. Please verify your email address by opening the link below:",
        "",
        verificationUrl,
        "",
        "This link will expire in 15 minutes. If you didn't create this account, you can safely ignore this email.",
    ].join("\n");

    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="margin: 0 0 16px;">Verify your email</h2>
            <p>Hi ${fullName},</p>
            <p>Thanks for signing up for <strong>BlockForms</strong>. Click the button below to verify your email address.</p>
            <p style="margin: 24px 0;">
                <a
                    href="${verificationUrl}"
                    style="display:inline-block;padding:12px 20px;background:#d68582;color:#fafafa;text-decoration:none;border-radius:6px;font-weight:600;"
                >
                    Verify email
                </a>
            </p>
            <p style="color:#fff7ed;font-size:13px;">
                Or copy and paste this link into your browser:<br/>
                <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            <p style="color:#888;font-size:12px;margin-top:32px;">
                This link will expire in 15 minutes. If you didn't create this account, you can ignore this email.
            </p>
        </div>
    `;

    return sendEmail({ to, subject, text, html });
};
