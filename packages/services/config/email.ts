import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { env } from "../env";

export const emailTransportOptions: SMTPTransport.Options = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
};
