import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean,
    numeric,
    pgEnum,
    unique,
    jsonb,
} from "drizzle-orm/pg-core";
import { formsTable } from "./form";

export const fieldTypeEnum = pgEnum("field_type", [
    "SHORT_TEXT",
    "LONG_TEXT",
    "EMAIL",
    "NUMBER",
    "SINGLE_CHOICE",
    "MULTI_CHOICE",
    "RATING",
    "YES_NO",
    "PASSWORD",
]);

export type FormFieldConfig = Record<string, unknown>;

export const formFieldsTable = pgTable(
    "form_fields",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        type: fieldTypeEnum("type").notNull(),

        label: varchar("label", { length: 100 }).notNull(),
        labelKey: varchar("label_key", { length: 100 }).notNull(),

        description: varchar("description", { length: 255 }),

        placeholder: varchar("placeholder", { length: 55 }),

        isRequired: boolean("is_required").default(false).notNull(),

        index: numeric("index", { scale: 2 }).notNull(),

        config: jsonb("config").$type<FormFieldConfig>().default({}).notNull(),

        // No `onDelete: "cascade"` here on purpose: form deletion is a soft delete
        // (forms.deletedAt). We never want a stray hard-delete on `forms` to nuke
        // the fields and -- through their cascading FKs -- the options and
        // submissions hanging off them.
        formId: uuid("form_id")
            .references(() => formsTable.id)
            .notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => {
        return {
            uniqueFormIdAndIndex: unique("unique_form_id_and_index").on(table.formId, table.index),
            uniqueFormIdAndLabelKey: unique("unique_form_id_and_label_key").on(
                table.formId,
                table.labelKey,
            ),
        };
    },
);
