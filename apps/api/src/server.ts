import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";
import cookieParser from "cookie-parser";

import { serverRouter, createContext, createExpressRateLimit } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();

app.set("trust proxy", 1);

const globalRateLimit = createExpressRateLimit({
    windowMs: 60_000,
    max: 200,
    keyPrefix: "global",
});

const authPathRateLimit = createExpressRateLimit({
    windowMs: 15 * 60_000,
    max: 25,
    keyPrefix: "auth-path",
    message: "Too many authentication attempts. Please try again later.",
});
const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "FormBuilder OpenAPI",
    version: "1.0.0",
    baseUrl: env.BASE_URL.concat("/api"),
});

app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
);

app.use(cookieParser());
app.use(globalRateLimit);

app.use(express.json());

app.get("/", (req, res) => {
    return res.json({ message: "FormBuilder is up and running..." });
});

app.get("/health", (req, res) => {
    return res.json({ message: "FormBuilder server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
    return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use("/api/authentication", authPathRateLimit);

app.use(
    "/api",
    createOpenApiExpressMiddleware({
        router: serverRouter,
        createContext,
    }),
);

app.use(
    "/trpc",
    trpcExpress.createExpressMiddleware({
        router: serverRouter,
        createContext,
    }),
);

export default app;
