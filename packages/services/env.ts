import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().describe("URL of where the DB is hosted."),

    HASHING_ALGORITHM: z.string().describe("Hashing algorithm used for hashing tokens"),

    JWT_ACCESS_SECRET: z.string().describe("Secret key for JWT Access Token"),
    JWT_ACCESS_EXPIRES: z.string().describe("Expiry of Access Token"),
    JWT_REFRESH_SECRET: z.string().describe("Secret key for JWT Refresh Token"),
    JWT_REFRESH_EXPIRES: z.string().describe("Expiry of Refresh Token"),

    SMTP_HOST: z.string().describe("The SMTP host being used by our backend"),
    SMTP_PORT: z.coerce.number().int().positive().describe("The SMTP port"),
    SMTP_USER: z.string().describe("The SMTP user"),
    SMTP_PASS: z.string().describe("The SMTP API Token"),

    SENDER_EMAIL: z.email().describe("Email address used as the From: of outbound mail"),

    APP_BASE_URL: z
        .string()
        .url()
        .default("http://localhost:3000")
        .describe("Base URL of the web app (used to build email links)"),
});

function createEnv(env: NodeJS.ProcessEnv) {
    const safeParseResult = envSchema.safeParse(env);
    if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
    return safeParseResult.data;
}

export const env = createEnv(process.env);
