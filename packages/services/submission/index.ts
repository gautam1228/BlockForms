import { and, asc, count, db, desc, eq, inArray, isNull } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { formFieldsTable } from "@repo/database/models/form-field";
import { formFieldOptionsTable } from "@repo/database/models/form-field-option";
import { formSubmissionsTable } from "@repo/database/models/form-submission";
import { formSubmissionAnswersTable } from "@repo/database/models/form-submission-answer";

import {
    type DeleteSubmissionInputType,
    type GetSubmissionByIdInputType,
    type GetSubmissionCountForFormInputType,
    type ListSubmissionsForFormInputType,
    type SubmitFormInputType,
    deleteSubmissionInput,
    getSubmissionByIdInput,
    getSubmissionCountForFormInput,
    listSubmissionsForFormInput,
    submitFormInput,
} from "./model";
import { verifyPassword } from "../utils/password-utils";

type FieldRow = typeof formFieldsTable.$inferSelect;
type OptionRow = typeof formFieldOptionsTable.$inferSelect;

interface SubmitContext {
    submitterId: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
}

class SubmissionService {
    /**
     * Asserts the caller owns the form (and that it isn't soft-deleted) so
     * dashboard/admin endpoints don't expose anyone else's submissions.
     */
    private async assertFormOwnership(formId: string, userId: string) {
        const rows = await db
            .select({
                id: formsTable.id,
                createdBy: formsTable.createdBy,
                status: formsTable.status,
            })
            .from(formsTable)
            .where(and(eq(formsTable.id, formId), isNull(formsTable.deletedAt)));

        const form = rows[0];
        if (!form) throw new Error("Form not found.");
        if (form.createdBy !== userId) throw new Error("You do not have access to this form.");
        return form;
    }

    /**
     * Validates a single answer against the field's type. For choice fields
     * we also require the referenced option id(s) to belong to that field.
     * Returns the value normalized for storage (so `null`/`undefined` for an
     * unanswered optional field never gets persisted).
     */
    private validateAnswer(
        field: FieldRow,
        value: unknown,
        optionIdsForField: ReadonlySet<string>,
    ): unknown {
        const fieldType = field.type;
        const label = field.label;

        switch (fieldType) {
            case "SHORT_TEXT":
            case "LONG_TEXT":
            case "EMAIL":
            case "PASSWORD": {
                if (typeof value !== "string") {
                    throw new Error(`"${label}" must be a string.`);
                }
                if (fieldType === "EMAIL" && value.length > 0) {
                    // Cheap RFC-5322-ish check; full validation lives in zod
                    // elsewhere but we don't want to import the whole schema
                    // here just for one regex.
                    if (!/^\S+@\S+\.\S+$/.test(value)) {
                        throw new Error(`"${label}" must be a valid email address.`);
                    }
                }
                return value;
            }
            case "NUMBER":
            case "RATING": {
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    throw new Error(`"${label}" must be a number.`);
                }
                return value;
            }
            case "YES_NO": {
                if (typeof value !== "boolean") {
                    throw new Error(`"${label}" must be true or false.`);
                }
                return value;
            }
            case "SINGLE_CHOICE": {
                if (typeof value !== "string") {
                    throw new Error(`"${label}" must be a single option id.`);
                }
                if (!optionIdsForField.has(value)) {
                    throw new Error(`"${label}" has an invalid option selected.`);
                }
                return value;
            }
            case "MULTI_CHOICE": {
                if (!Array.isArray(value)) {
                    throw new Error(`"${label}" must be a list of option ids.`);
                }
                const ids = value;
                if (ids.length === 0) {
                    throw new Error(`"${label}" requires at least one selection.`);
                }
                const seen = new Set<string>();
                for (const id of ids) {
                    if (typeof id !== "string" || !optionIdsForField.has(id)) {
                        throw new Error(`"${label}" has an invalid option selected.`);
                    }
                    if (seen.has(id)) {
                        throw new Error(`"${label}" has duplicate selections.`);
                    }
                    seen.add(id);
                }
                return ids;
            }
            default: {
                // Exhaustive guard: if a new field type is added to the enum
                // but no case here, this will fail loudly in tests.
                const _exhaustive: never = fieldType;
                throw new Error(`Unsupported field type: ${_exhaustive}.`);
            }
        }
    }

    /**
     * Records a submission against a PUBLISHED, non-deleted form. Public:
     * anonymous submissions are allowed (in which case `submitterId` is null).
     * Validation runs *before* the transaction
     */
    public async submitForm(payload: SubmitFormInputType, context: SubmitContext) {
        const { formId, password, answers } = await submitFormInput.parseAsync(payload);

        const formRow = await db
            .select({
                id: formsTable.id,
                status: formsTable.status,
                deletedAt: formsTable.deletedAt,
                requiresLogin: formsTable.requiresLogin,
                passwordHash: formsTable.passwordHash,
                passwordSalt: formsTable.passwordSalt,
            })
            .from(formsTable)
            .where(eq(formsTable.id, formId))
            .then((rows) => rows[0]);

        if (!formRow || formRow.deletedAt || formRow.status !== "PUBLISHED") {
            throw new Error("This form is not accepting submissions.");
        }

        if (formRow.requiresLogin && !context.submitterId) {
            throw new Error("Sign in is required to submit this form.");
        }

        if (formRow.passwordHash) {
            if (
                !password ||
                !formRow.passwordSalt ||
                !verifyPassword(formRow.passwordSalt, formRow.passwordHash, password)
            ) {
                throw new Error("Incorrect password.");
            }
        }

        const fieldRows = await db
            .select()
            .from(formFieldsTable)
            .where(eq(formFieldsTable.formId, formId))
            .orderBy(asc(formFieldsTable.index));

        if (fieldRows.length === 0) {
            throw new Error("This form has no fields.");
        }

        const fieldsById = new Map(fieldRows.map((f) => [f.id, f] as const));

        const choiceFieldIds = fieldRows
            .filter((f) => f.type === "SINGLE_CHOICE" || f.type === "MULTI_CHOICE")
            .map((f) => f.id);

        const optionRows: OptionRow[] = choiceFieldIds.length
            ? await db
                  .select()
                  .from(formFieldOptionsTable)
                  .where(inArray(formFieldOptionsTable.formFieldId, choiceFieldIds))
            : [];

        const optionIdsByFieldId = new Map<string, Set<string>>();
        for (const option of optionRows) {
            const bucket = optionIdsByFieldId.get(option.formFieldId) ?? new Set<string>();
            bucket.add(option.id);
            optionIdsByFieldId.set(option.formFieldId, bucket);
        }

        // Reject duplicate fieldIds in the payload before per-field validation
        // so the error message is clear and we don't silently overwrite.
        const answersByFieldId = new Map<string, unknown>();
        for (const answer of answers) {
            const field = fieldsById.get(answer.fieldId);
            if (!field) {
                throw new Error(`Unknown field id: ${answer.fieldId}.`);
            }
            if (answersByFieldId.has(answer.fieldId)) {
                throw new Error(`Duplicate answer for field "${field.label}".`);
            }
            answersByFieldId.set(answer.fieldId, answer.value);
        }

        // Enforce required-field presence and validate each provided answer.
        const normalizedAnswers: { fieldId: string; value: unknown }[] = [];
        for (const field of fieldRows) {
            const raw = answersByFieldId.get(field.id);
            const isMissing = raw === undefined || raw === null || raw === "";
            if (isMissing) {
                if (field.isRequired) {
                    throw new Error(`"${field.label}" is required.`);
                }
                continue;
            }
            const normalized = this.validateAnswer(
                field,
                raw,
                optionIdsByFieldId.get(field.id) ?? new Set(),
            );
            normalizedAnswers.push({ fieldId: field.id, value: normalized });
        }

        const result = await db.transaction(async (tx) => {
            const submissionRows = await tx
                .insert(formSubmissionsTable)
                .values({
                    formId,
                    submitterId: context.submitterId ?? null,
                    ipAddress: context.ipAddress ?? null,
                    userAgent: context.userAgent ?? null,
                })
                .returning({
                    id: formSubmissionsTable.id,
                    submittedAt: formSubmissionsTable.submittedAt,
                });

            const submission = submissionRows[0];
            if (!submission) throw new Error("Failed to record the submission.");

            if (normalizedAnswers.length > 0) {
                await tx.insert(formSubmissionAnswersTable).values(
                    normalizedAnswers.map((a) => ({
                        submissionId: submission.id,
                        formFieldId: a.fieldId,
                        value: a.value,
                    })),
                );
            }

            return submission;
        });

        return { id: result.id, submittedAt: result.submittedAt };
    }

    /**
     * Owner-only fetch. Returns the submission row plus all of its answers in
     * their parent fields' display order.
     */
    public async getSubmissionById(userId: string, payload: GetSubmissionByIdInputType) {
        const { id } = await getSubmissionByIdInput.parseAsync(payload);

        const submissionRow = await db
            .select()
            .from(formSubmissionsTable)
            .where(eq(formSubmissionsTable.id, id))
            .then((rows) => rows[0]);

        if (!submissionRow) throw new Error("Submission not found.");

        await this.assertFormOwnership(submissionRow.formId, userId);

        const answerRows = await db
            .select({
                id: formSubmissionAnswersTable.id,
                formFieldId: formSubmissionAnswersTable.formFieldId,
                value: formSubmissionAnswersTable.value,
                fieldIndex: formFieldsTable.index,
            })
            .from(formSubmissionAnswersTable)
            .innerJoin(
                formFieldsTable,
                eq(formFieldsTable.id, formSubmissionAnswersTable.formFieldId),
            )
            .where(eq(formSubmissionAnswersTable.submissionId, id))
            .orderBy(asc(formFieldsTable.index));

        return {
            id: submissionRow.id,
            formId: submissionRow.formId,
            submitterId: submissionRow.submitterId,
            submittedAt: submissionRow.submittedAt,
            answers: answerRows.map(({ fieldIndex: _ignored, ...rest }) => rest),
        };
    }

    /**
     * Owner-only paginated listing. Lightweight projection (no answers);
     * pull `getSubmissionById` for full detail.
     */
    public async listSubmissionsForForm(userId: string, payload: ListSubmissionsForFormInputType) {
        const { formId, limit, offset } = await listSubmissionsForFormInput.parseAsync(payload);

        await this.assertFormOwnership(formId, userId);

        return db
            .select({
                id: formSubmissionsTable.id,
                submitterId: formSubmissionsTable.submitterId,
                submittedAt: formSubmissionsTable.submittedAt,
            })
            .from(formSubmissionsTable)
            .where(eq(formSubmissionsTable.formId, formId))
            .orderBy(desc(formSubmissionsTable.submittedAt))
            .limit(limit)
            .offset(offset);
    }

    public async getSubmissionCountForForm(
        userId: string,
        payload: GetSubmissionCountForFormInputType,
    ) {
        const { formId } = await getSubmissionCountForFormInput.parseAsync(payload);

        await this.assertFormOwnership(formId, userId);

        const rows = await db
            .select({ value: count() })
            .from(formSubmissionsTable)
            .where(eq(formSubmissionsTable.formId, formId));

        return { count: rows[0]?.value ?? 0 };
    }

    /**
     * Hard delete: removes the submission and its answers (the answers FK has
     * `onDelete: "cascade"`). Submissions don't carry the historical weight
     * that forms do, so soft delete here would be overkill.
     */
    public async deleteSubmission(userId: string, payload: DeleteSubmissionInputType) {
        const { id } = await deleteSubmissionInput.parseAsync(payload);

        const submissionRow = await db
            .select({ id: formSubmissionsTable.id, formId: formSubmissionsTable.formId })
            .from(formSubmissionsTable)
            .where(eq(formSubmissionsTable.id, id))
            .then((rows) => rows[0]);

        if (!submissionRow) throw new Error("Submission not found.");

        await this.assertFormOwnership(submissionRow.formId, userId);

        await db.delete(formSubmissionsTable).where(eq(formSubmissionsTable.id, id));

        return { id };
    }
}

export default SubmissionService;
