import { pgTable, uuid, varchar, timestamp, text, jsonb } from "drizzle-orm/pg-core";
import { formsTable } from "./form";
import { usersTable } from "./user";

// One row per response. `submitterId` is nullable because public forms can be
// filled in anonymously. We deliberately do NOT cascade from `forms` so the
// soft-delete model on `forms` keeps submission history intact.
export const formSubmissionsTable = pgTable("form_submissions", {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
        .references(() => formsTable.id)
        .notNull(),

    submitterId: uuid("submitter_id").references(() => usersTable.id),

    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}).notNull(),

    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});
