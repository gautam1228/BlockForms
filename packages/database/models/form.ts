import { pgTable, uuid, varchar, timestamp, pgEnum, boolean, text } from "drizzle-orm/pg-core";
import { usersTable } from "./user";

export const formStatusEnum = pgEnum("form_status", ["DRAFT", "PUBLISHED"]);
export const formVisibilityEnum = pgEnum("form_visibility", ["PUBLIC", "UNLISTED"]);
export const formThemeEnum = pgEnum("form_theme", ["GRASS", "STONE", "NETHER", "END"]);

export const formsTable = pgTable("forms", {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 55 }).notNull(),
    description: varchar("description", { length: 255 }),

    createdBy: uuid("created_by")
        .references(() => usersTable.id)
        .notNull(),

    status: formStatusEnum("status").default("DRAFT").notNull(),
    visibility: formVisibilityEnum("visibility").default("UNLISTED").notNull(),

    theme: formThemeEnum("theme").default("GRASS").notNull(),

    // When true, respondents must be signed in to open or submit the form.
    requiresLogin: boolean("requires_login").default(false).notNull(),

    // Optional shared-secret gate. When `passwordHash` is null the form has
    // no password. We use the same HMAC + per-row salt scheme as `users`
    // (see `services/utils/password-utils.ts`).
    passwordHash: text("password_hash"),
    passwordSalt: text("password_salt"),

    publishedAt: timestamp("published_at"),

    // Soft-delete column. When set, the form is hidden from every API surface
    // but related data (fields, options, submissions) is preserved so that
    // restores -- and any historical submission lookups -- still work.
    deletedAt: timestamp("deleted_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});
