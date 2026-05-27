import { pgTable, uuid, jsonb, unique } from "drizzle-orm/pg-core";
import { formSubmissionsTable } from "./form-submission";
import { formFieldsTable } from "./form-field";

// One row per answered field on a submission. `value` is stored as raw JSON
// and interpreted by reference to the parent field's `type`:
//   SHORT_TEXT/LONG_TEXT/EMAIL/PASSWORD -> string
//   NUMBER/RATING                       -> number
//   YES_NO                              -> boolean
//   SINGLE_CHOICE                       -> string (form_field_options.id)
//   MULTI_CHOICE                        -> string[] (form_field_options.id[])
// The FK to `form_fields` is NOT cascaded -- a form may be soft-deleted and
// we still want to be able to render historical answers.
export const formSubmissionAnswersTable = pgTable(
    "form_submission_answers",
    {
        id: uuid("id").primaryKey().defaultRandom(),

        submissionId: uuid("submission_id")
            .references(() => formSubmissionsTable.id, { onDelete: "cascade" })
            .notNull(),

        formFieldId: uuid("form_field_id")
            .references(() => formFieldsTable.id)
            .notNull(),

        value: jsonb("value").$type<unknown>(),
    },
    (table) => {
        return {
            uniqueSubmissionAndField: unique("unique_submission_and_field").on(
                table.submissionId,
                table.formFieldId,
            ),
        };
    },
);
