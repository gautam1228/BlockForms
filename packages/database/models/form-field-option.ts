import { pgTable, uuid, varchar, timestamp, numeric, unique } from "drizzle-orm/pg-core";
import { formFieldsTable } from "./form-field";

// Options for SINGLE_CHOICE and MULTI_CHOICE fields. Kept in a separate table
// so each option has a stable UUID that submissions can reference; renaming or
// reordering an option then doesn't corrupt historical responses.
export const formFieldOptionsTable = pgTable(
    "form_field_options",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        formFieldId: uuid("form_field_id")
            .references(() => formFieldsTable.id, { onDelete: "cascade" })
            .notNull(),

        label: varchar("label", { length: 100 }).notNull(),
        // Stable key used in exports/analytics so renaming `label` doesn't break
        // downstream consumers. Mirrors `labelKey` on form_fields.
        valueKey: varchar("value_key", { length: 100 }).notNull(),

        index: numeric("index", { scale: 2 }).notNull(),

        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => {
        return {
            uniqueFieldIdAndIndex: unique("unique_field_id_and_index").on(
                table.formFieldId,
                table.index,
            ),
            uniqueFieldIdAndValueKey: unique("unique_field_id_and_value_key").on(
                table.formFieldId,
                table.valueKey,
            ),
        };
    },
);
