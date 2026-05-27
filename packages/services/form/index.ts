import { and, asc, db, desc, eq, inArray, isNull } from "@repo/database";
import { formsTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { formFieldsTable } from "@repo/database/models/form-field";
import { formFieldOptionsTable } from "@repo/database/models/form-field-option";
import { formSubmissionAnswersTable } from "@repo/database/models/form-submission-answer";

import {
    type CreateDraftFormInputType,
    type DeleteFormInputType,
    type FieldType,
    type FormFieldInputType,
    type FormFieldOptionInputType,
    type GetFormByIdInputType,
    type GetPublishedFormByIdInputType,
    type ListPublicFormsInputType,
    type PublishFormInputType,
    type SaveDraftFormInputType,
    type UnpublishFormInputType,
    type UpdateFormSettingsInputType,
    type UpdateFormVisibilityInputType,
    createDraftFormInput,
    deleteFormInput,
    getFormByIdInput,
    getPublishedFormByIdInput,
    listPublicFormsInput,
    publishFormInput,
    saveDraftFormInput,
    unpublishFormInput,
    updateFormSettingsInput,
    updateFormVisibilityInput,
} from "./model";
import { generateSalt, hashPassword, verifyPassword } from "../utils/password-utils";
import { indexFromPayloadOrder, stagingFieldIndex, stagingOptionIndex } from "./field-index";

const CHOICE_FIELD_TYPES: ReadonlySet<FieldType> = new Set(["SINGLE_CHOICE", "MULTI_CHOICE"]);

const DEFAULT_DRAFT_TITLE = "Untitled form";

type DbExecutor = Pick<typeof db, "select" | "insert" | "update" | "delete">;

class FormService {
    /**
     * Resolves a form row and asserts the caller owns it. Used by every
     * owner-only mutation so we never trust client-supplied form IDs blindly.
     */
    private async assertOwnership(formId: string, userId: string) {
        const result = await db
            .select({
                id: formsTable.id,
                createdBy: formsTable.createdBy,
                status: formsTable.status,
                visibility: formsTable.visibility,
            })
            .from(formsTable)
            .where(and(eq(formsTable.id, formId), isNull(formsTable.deletedAt)));

        const form = result?.[0];
        if (!form) throw new Error("Form not found.");
        if (form.createdBy !== userId) throw new Error("You do not have access to this form.");

        return form;
    }

    /**
     * Validates that each field's payload is internally consistent before we
     * commit it to the DB. Centralized so saveDraft (and any future endpoints
     * that accept fields) share the same rules.
     */
    private validateFieldsPayload(fields: ReadonlyArray<FormFieldInputType>) {
        const seenLabelKeys = new Set<string>();

        for (const field of fields) {
            if (seenLabelKeys.has(field.labelKey)) {
                throw new Error(`Duplicate field key: ${field.labelKey}.`);
            }
            seenLabelKeys.add(field.labelKey);

            const isChoice = CHOICE_FIELD_TYPES.has(field.type);
            const options = field.options ?? [];

            if (isChoice) {
                if (options.length < 2) {
                    throw new Error(`Field "${field.label}" must have at least two options.`);
                }
                const seenOptionKeys = new Set<string>();
                for (const option of options) {
                    if (seenOptionKeys.has(option.valueKey)) {
                        throw new Error(
                            `Duplicate option key in field "${field.label}": ${option.valueKey}.`,
                        );
                    }
                    seenOptionKeys.add(option.valueKey);
                }
            } else if (options.length > 0) {
                throw new Error(
                    `Field "${field.label}" of type ${field.type} cannot have options.`,
                );
            }
        }
    }

    /**
     * Clears `(form_id, index)` unique slots before final fractional indices
     * are written (9000.01, 9000.02, … — uses numeric scale 2).
     */
    private async stageFormFieldIndices(tx: DbExecutor, formId: string) {
        const rows = await tx
            .select({ id: formFieldsTable.id })
            .from(formFieldsTable)
            .where(eq(formFieldsTable.formId, formId));

        for (let i = 0; i < rows.length; i++) {
            await tx
                .update(formFieldsTable)
                .set({ index: stagingFieldIndex(i) })
                .where(eq(formFieldsTable.id, rows[i]!.id));
        }
    }

    /** Clears `(form_id, label_key)` slots before final keys are written. */
    private async stageFormFieldLabelKeys(tx: DbExecutor, formId: string) {
        const rows = await tx
            .select({ id: formFieldsTable.id })
            .from(formFieldsTable)
            .where(eq(formFieldsTable.formId, formId));

        for (let i = 0; i < rows.length; i++) {
            await tx
                .update(formFieldsTable)
                .set({ labelKey: `z_stage_${i}` })
                .where(eq(formFieldsTable.id, rows[i]!.id));
        }
    }

    private async stageFieldOptionIndices(tx: DbExecutor, fieldId: string) {
        const rows = await tx
            .select({ id: formFieldOptionsTable.id })
            .from(formFieldOptionsTable)
            .where(eq(formFieldOptionsTable.formFieldId, fieldId));

        for (let i = 0; i < rows.length; i++) {
            await tx
                .update(formFieldOptionsTable)
                .set({ index: stagingOptionIndex(i) })
                .where(eq(formFieldOptionsTable.id, rows[i]!.id));
        }
    }

    private async stageFieldOptionValueKeys(tx: DbExecutor, fieldId: string) {
        const rows = await tx
            .select({ id: formFieldOptionsTable.id })
            .from(formFieldOptionsTable)
            .where(eq(formFieldOptionsTable.formFieldId, fieldId));

        for (let i = 0; i < rows.length; i++) {
            await tx
                .update(formFieldOptionsTable)
                .set({ valueKey: `z_stage_${i}` })
                .where(eq(formFieldOptionsTable.id, rows[i]!.id));
        }
    }

    /**
     * Upserts options for a choice field. Non-choice fields have their options
     * cleared. Option rows are updated in place so submission answers that
     * reference option ids stay valid.
     */
    private async syncFieldOptions(
        tx: DbExecutor,
        fieldId: string,
        fieldType: FieldType,
        options: ReadonlyArray<FormFieldOptionInputType>,
    ) {
        if (!CHOICE_FIELD_TYPES.has(fieldType)) {
            await tx
                .delete(formFieldOptionsTable)
                .where(eq(formFieldOptionsTable.formFieldId, fieldId));
            return;
        }

        const existing = await tx
            .select({
                id: formFieldOptionsTable.id,
                valueKey: formFieldOptionsTable.valueKey,
            })
            .from(formFieldOptionsTable)
            .where(eq(formFieldOptionsTable.formFieldId, fieldId));

        const orderedOptions = options
            .map((option, payloadOrder) => ({ option, payloadOrder }))
            .sort((a, b) => {
                const indexA = a.option.index ?? a.payloadOrder + 1;
                const indexB = b.option.index ?? b.payloadOrder + 1;
                if (indexA !== indexB) return indexA - indexB;
                return a.payloadOrder - b.payloadOrder;
            })
            .map(({ option }) => option);

        if (existing.length > 0 && orderedOptions.length > 0) {
            await this.stageFieldOptionIndices(tx, fieldId);
            await this.stageFieldOptionValueKeys(tx, fieldId);
        }

        const existingIds = new Set(existing.map((o) => o.id));
        const existingIdByValueKey = new Map(existing.map((o) => [o.valueKey, o.id]));
        const keptOptionIds = new Set<string>();

        for (let position = 0; position < orderedOptions.length; position++) {
            const option = orderedOptions[position]!;
            const values = {
                label: option.label,
                valueKey: option.valueKey,
                index: indexFromPayloadOrder(position),
            };

            let optionId: string;
            if (option.id && existingIds.has(option.id)) {
                await tx
                    .update(formFieldOptionsTable)
                    .set(values)
                    .where(eq(formFieldOptionsTable.id, option.id));
                optionId = option.id;
            } else {
                const existingId = existingIdByValueKey.get(option.valueKey);
                if (existingId) {
                    await tx
                        .update(formFieldOptionsTable)
                        .set(values)
                        .where(eq(formFieldOptionsTable.id, existingId));
                    optionId = existingId;
                } else {
                    const inserted = await tx
                        .insert(formFieldOptionsTable)
                        .values({ formFieldId: fieldId, ...values })
                        .returning({ id: formFieldOptionsTable.id });
                    const newId = inserted[0]?.id;
                    if (!newId) throw new Error("Failed to save a new option.");
                    optionId = newId;
                }
            }
            keptOptionIds.add(optionId);
        }

        const optionIdsToDelete = [...existingIds].filter((id) => !keptOptionIds.has(id));
        if (optionIdsToDelete.length > 0) {
            await tx
                .delete(formFieldOptionsTable)
                .where(inArray(formFieldOptionsTable.id, optionIdsToDelete));
        }
    }

    /**
     * password hash/salt because the service uses them for gate checks; the
     * service is responsible for stripping them before returning to callers.
     */
    private async fetchFormRow(formId: string) {
        const rows = await db
            .select()
            .from(formsTable)
            .where(and(eq(formsTable.id, formId), isNull(formsTable.deletedAt)));
        return rows[0] ?? null;
    }

    /**
     * Loads all fields (with their options) for a form, ordered by `index`.
     * The numeric `index` column is stored as a string in Postgres; coerce
     * to number so callers get clean JS.
     */
    private async fetchFieldsWithOptions(formId: string) {
        const fieldRows = await db
            .select()
            .from(formFieldsTable)
            .where(eq(formFieldsTable.formId, formId))
            .orderBy(asc(formFieldsTable.index));

        const fieldIds = fieldRows.map((f) => f.id);
        const optionRows = fieldIds.length
            ? await db
                  .select()
                  .from(formFieldOptionsTable)
                  .where(inArray(formFieldOptionsTable.formFieldId, fieldIds))
                  .orderBy(asc(formFieldOptionsTable.index))
            : [];

        const optionsByFieldId = new Map<string, typeof optionRows>();
        for (const option of optionRows) {
            const bucket = optionsByFieldId.get(option.formFieldId) ?? [];
            bucket.push(option);
            optionsByFieldId.set(option.formFieldId, bucket);
        }

        return fieldRows.map((field) => ({
            id: field.id,
            type: field.type,
            label: field.label,
            labelKey: field.labelKey,
            description: field.description,
            placeholder: field.placeholder,
            isRequired: field.isRequired,
            index: Number(field.index),
            config: field.config,
            options: (optionsByFieldId.get(field.id) ?? []).map((option) => ({
                id: option.id,
                label: option.label,
                valueKey: option.valueKey,
                index: Number(option.index),
            })),
        }));
    }

    /**
     * Projects a form row into the shape we expose externally (i.e. without
     * the password hash/salt). Adds the `hasPassword` boolean derived from
     * the hash so consumers can know a password gate exists without seeing
     * the hash itself.
     */
    private projectFormMeta(formRow: typeof formsTable.$inferSelect) {
        return {
            id: formRow.id,
            title: formRow.title,
            description: formRow.description,
            status: formRow.status,
            visibility: formRow.visibility,
            theme: formRow.theme,
            createdBy: formRow.createdBy,
            requiresLogin: formRow.requiresLogin,
            hasPassword: formRow.passwordHash !== null,
            publishedAt: formRow.publishedAt,
            createdAt: formRow.createdAt,
            updatedAt: formRow.updatedAt,
        };
    }

    /**
     * Creates an empty draft form owned by `userId`. The create-form page can
     * call this on first "Sync to DB" so subsequent autosaves have an id to
     * upsert against. Title defaults to "Untitled form" when omitted.
     */
    public async createDraft(userId: string, payload: CreateDraftFormInputType) {
        const { title, description, theme } = await createDraftFormInput.parseAsync(payload);

        const result = await db
            .insert(formsTable)
            .values({
                title: title ?? DEFAULT_DRAFT_TITLE,
                description: description ?? null,
                createdBy: userId,
                ...(theme ? { theme } : {}),
            })
            .returning({
                id: formsTable.id,
                title: formsTable.title,
                description: formsTable.description,
                status: formsTable.status,
                visibility: formsTable.visibility,
                theme: formsTable.theme,
                requiresLogin: formsTable.requiresLogin,
                passwordHash: formsTable.passwordHash,
                publishedAt: formsTable.publishedAt,
                createdAt: formsTable.createdAt,
                updatedAt: formsTable.updatedAt,
            });

        const form = result?.[0];
        if (!form) throw new Error("Failed to create the draft form.");
        const { passwordHash, ...rest } = form;
        return { ...rest, hasPassword: passwordHash !== null };
    }

    /**
     * Persists the editor's in-progress state to the DB. Fields and options are
     * synced incrementally (update/insert/delete) so that rows referenced by
     * existing submission answers are not wiped by a blanket delete.
     */
    public async saveDraft(userId: string, payload: SaveDraftFormInputType) {
        const { id, title, description, theme, fields } =
            await saveDraftFormInput.parseAsync(payload);

        const form = await this.assertOwnership(id, userId);
        if (form.status !== "DRAFT") {
            throw new Error("Only draft forms can be edited. Unpublish the form to make changes.");
        }

        this.validateFieldsPayload(fields);

        const orderedFields = fields
            .map((field, payloadOrder) => ({ field, payloadOrder }))
            .sort((a, b) => {
                const indexA = a.field.index ?? a.payloadOrder + 1;
                const indexB = b.field.index ?? b.payloadOrder + 1;
                if (indexA !== indexB) return indexA - indexB;
                return a.payloadOrder - b.payloadOrder;
            })
            .map(({ field }) => field);

        await db.transaction(async (tx) => {
            await tx
                .update(formsTable)
                .set({ title, description: description ?? null, theme })
                .where(eq(formsTable.id, id));

            const existingFields = await tx
                .select({
                    id: formFieldsTable.id,
                    label: formFieldsTable.label,
                    labelKey: formFieldsTable.labelKey,
                })
                .from(formFieldsTable)
                .where(eq(formFieldsTable.formId, id));

            const existingFieldIds = new Set(existingFields.map((f) => f.id));
            const existingFieldIdByLabelKey = new Map(
                existingFields.map((f) => [f.labelKey, f.id]),
            );
            const keptFieldIds = new Set<string>();

            for (const field of orderedFields) {
                if (field.id) {
                    if (!existingFieldIds.has(field.id)) {
                        throw new Error(`Unknown field id: ${field.id}.`);
                    }
                    keptFieldIds.add(field.id);
                }
            }

            if (existingFields.length > 0) {
                await this.stageFormFieldIndices(tx, id);
                await this.stageFormFieldLabelKeys(tx, id);
            }

            for (let position = 0; position < orderedFields.length; position++) {
                const field = orderedFields[position]!;
                const fieldValues = {
                    type: field.type,
                    label: field.label,
                    labelKey: field.labelKey,
                    description: field.description ?? null,
                    placeholder: field.placeholder ?? null,
                    isRequired: field.isRequired,
                    index: indexFromPayloadOrder(position),
                    config: field.config,
                };

                let fieldId: string;
                if (field.id) {
                    await tx
                        .update(formFieldsTable)
                        .set(fieldValues)
                        .where(eq(formFieldsTable.id, field.id));
                    fieldId = field.id;
                } else {
                    const existingId = existingFieldIdByLabelKey.get(field.labelKey);
                    if (existingId) {
                        await tx
                            .update(formFieldsTable)
                            .set(fieldValues)
                            .where(eq(formFieldsTable.id, existingId));
                        fieldId = existingId;
                    } else {
                        const inserted = await tx
                            .insert(formFieldsTable)
                            .values({ formId: id, ...fieldValues })
                            .returning({ id: formFieldsTable.id });
                        const insertedId = inserted[0]?.id;
                        if (!insertedId) throw new Error("Failed to save a new field.");
                        fieldId = insertedId;
                    }
                }
                keptFieldIds.add(fieldId);

                await this.syncFieldOptions(tx, fieldId, field.type, field.options ?? []);
            }

            const fieldIdsToDelete = existingFields
                .map((f) => f.id)
                .filter((fieldId) => !keptFieldIds.has(fieldId));

            if (fieldIdsToDelete.length === 0) return;

            const blocked = await tx
                .select({
                    label: formFieldsTable.label,
                })
                .from(formSubmissionAnswersTable)
                .innerJoin(
                    formFieldsTable,
                    eq(formFieldsTable.id, formSubmissionAnswersTable.formFieldId),
                )
                .where(inArray(formSubmissionAnswersTable.formFieldId, fieldIdsToDelete));

            if (blocked.length > 0) {
                const label = blocked[0]!.label;
                throw new Error(
                    `Cannot remove "${label}" because it already has responses. Keep the field or clear submissions first.`,
                );
            }

            await tx.delete(formFieldsTable).where(inArray(formFieldsTable.id, fieldIdsToDelete));
        });

        return { id, savedAt: new Date() };
    }

    /**
     * Flips a draft to PUBLISHED, stamping `publishedAt`. The caller picks
     * visibility at this step (UI should default to UNLISTED so opting in to
     * the explore page is a deliberate choice).
     */
    public async publishForm(userId: string, payload: PublishFormInputType) {
        const { id, visibility } = await publishFormInput.parseAsync(payload);

        const form = await this.assertOwnership(id, userId);
        if (form.status === "PUBLISHED") {
            // Already published; treat publish as an idempotent "set visibility".
            const result = await db
                .update(formsTable)
                .set({ visibility })
                .where(eq(formsTable.id, id))
                .returning({
                    id: formsTable.id,
                    status: formsTable.status,
                    visibility: formsTable.visibility,
                    publishedAt: formsTable.publishedAt,
                });
            return result[0]!;
        }

        // Refuse to publish a form with zero fields -- saves users from
        // shipping an empty submission page.
        const fieldCount = await db
            .select({ id: formFieldsTable.id })
            .from(formFieldsTable)
            .where(eq(formFieldsTable.formId, id));
        if (fieldCount.length === 0) {
            throw new Error("Add at least one field before publishing.");
        }

        const result = await db
            .update(formsTable)
            .set({
                status: "PUBLISHED",
                visibility,
                publishedAt: new Date(),
            })
            .where(eq(formsTable.id, id))
            .returning({
                id: formsTable.id,
                status: formsTable.status,
                visibility: formsTable.visibility,
                publishedAt: formsTable.publishedAt,
            });

        return result[0]!;
    }

    /**
     * Returns a published form to DRAFT so the owner can edit it. Public
     * links stop resolving until they republish.
     */
    public async unpublishForm(userId: string, payload: UnpublishFormInputType) {
        const { id } = await unpublishFormInput.parseAsync(payload);

        await this.assertOwnership(id, userId);

        const result = await db
            .update(formsTable)
            .set({ status: "DRAFT", publishedAt: null })
            .where(eq(formsTable.id, id))
            .returning({
                id: formsTable.id,
                status: formsTable.status,
                visibility: formsTable.visibility,
            });

        return result[0]!;
    }

    /**
     * Changes who can discover an already-published form. For draft forms
     * visibility is meaningless (only the owner can see them) but we still
     * persist it so it's the chosen value the moment the form is published.
     */
    public async updateVisibility(userId: string, payload: UpdateFormVisibilityInputType) {
        const { id, visibility } = await updateFormVisibilityInput.parseAsync(payload);

        await this.assertOwnership(id, userId);

        const result = await db
            .update(formsTable)
            .set({ visibility })
            .where(eq(formsTable.id, id))
            .returning({
                id: formsTable.id,
                status: formsTable.status,
                visibility: formsTable.visibility,
            });

        return result[0]!;
    }

    /**
     * Soft delete, Restoring becomes a one-column UPDATE later.
     */
    public async deleteForm(userId: string, payload: DeleteFormInputType) {
        const { id } = await deleteFormInput.parseAsync(payload);

        await this.assertOwnership(id, userId);

        await db.update(formsTable).set({ deletedAt: new Date() }).where(eq(formsTable.id, id));

        return { id };
    }

    /**
     * Owner-only fetch including all fields and options, regardless of status.
     * This is what the create-form / edit-form page should call when it loads.
     */
    public async getMyFormById(userId: string, payload: GetFormByIdInputType) {
        const { id } = await getFormByIdInput.parseAsync(payload);

        await this.assertOwnership(id, userId);

        const formRow = await this.fetchFormRow(id);
        if (!formRow) throw new Error("Form not found.");

        const fields = await this.fetchFieldsWithOptions(id);
        return { ...this.projectFormMeta(formRow), fields };
    }

    /**
     * Public-facing fetch for the submission page. Requires `status = PUBLISHED`
     * but does NOT filter on `visibility` (both PUBLIC and UNLISTED forms are
     * accessible by direct link; visibility only affects explore discovery).
     *
     * Honors the form's access gates:
     *   - `requiresLogin`: caller must pass `viewerId`.
     *   - `passwordHash`:  caller must pass a matching `password`.
     *
     * The response always includes the form's metadata + the gate flags so
     * the client can render the appropriate UI (sign-in prompt, password
     * prompt). `fields` is only populated when access is granted.
     */
    public async getPublishedFormById(
        payload: GetPublishedFormByIdInputType,
        viewerId: string | null,
    ) {
        const { id, password } = await getPublishedFormByIdInput.parseAsync(payload);

        const formRow = await this.fetchFormRow(id);
        if (!formRow || formRow.status !== "PUBLISHED") {
            throw new Error("Form not found.");
        }

        const loginSatisfied = formRow.requiresLogin ? viewerId !== null : true;
        const passwordSatisfied = formRow.passwordHash
            ? Boolean(
                  password &&
                  formRow.passwordSalt &&
                  verifyPassword(formRow.passwordSalt, formRow.passwordHash, password),
              )
            : true;

        const accessGranted = loginSatisfied && passwordSatisfied;

        const meta = this.projectFormMeta(formRow);
        const fields = accessGranted ? await this.fetchFieldsWithOptions(id) : [];

        return { ...meta, accessGranted, fields };
    }

    /**
     * Updates form-level settings (login requirement, password). Both fields
     * are optional; omit one to leave it untouched. Pass `password: null` to
     * clear an existing password.
     */
    public async updateFormSettings(userId: string, payload: UpdateFormSettingsInputType) {
        const parsed = await updateFormSettingsInput.parseAsync(payload);
        const { id, requiresLogin, theme, password } = parsed;

        await this.assertOwnership(id, userId);

        const updates: Partial<typeof formsTable.$inferInsert> = {};

        if (typeof requiresLogin === "boolean") {
            updates.requiresLogin = requiresLogin;
        }

        if (theme) {
            updates.theme = theme;
        }

        if (password === null) {
            updates.passwordHash = null;
            updates.passwordSalt = null;
        } else if (typeof password === "string") {
            const salt = generateSalt();
            updates.passwordHash = hashPassword(salt, password);
            updates.passwordSalt = salt;
        }

        if (Object.keys(updates).length === 0) {
            // Nothing to update; just echo current state.
            const formRow = await this.fetchFormRow(id);
            if (!formRow) throw new Error("Form not found.");
            return {
                id,
                requiresLogin: formRow.requiresLogin,
                theme: formRow.theme,
                hasPassword: formRow.passwordHash !== null,
            };
        }

        const result = await db
            .update(formsTable)
            .set(updates)
            .where(eq(formsTable.id, id))
            .returning({
                id: formsTable.id,
                requiresLogin: formsTable.requiresLogin,
                theme: formsTable.theme,
                passwordHash: formsTable.passwordHash,
            });

        const row = result[0]!;
        return {
            id: row.id,
            requiresLogin: row.requiresLogin,
            theme: row.theme,
            hasPassword: row.passwordHash !== null,
        };
    }

    /**
     * Dashboard listing for the signed-in user. Lightweight projection -- no
     * fields/options, just enough to render a list.
     */
    public async listMyForms(userId: string) {
        const rows = await db
            .select({
                id: formsTable.id,
                title: formsTable.title,
                description: formsTable.description,
                status: formsTable.status,
                visibility: formsTable.visibility,
                theme: formsTable.theme,
                requiresLogin: formsTable.requiresLogin,
                passwordHash: formsTable.passwordHash,
                publishedAt: formsTable.publishedAt,
                createdAt: formsTable.createdAt,
                updatedAt: formsTable.updatedAt,
            })
            .from(formsTable)
            .where(and(eq(formsTable.createdBy, userId), isNull(formsTable.deletedAt)))
            .orderBy(desc(formsTable.updatedAt));

        return rows.map(({ passwordHash, ...rest }) => ({
            ...rest,
            hasPassword: passwordHash !== null,
        }));
    }

    /**
     * Explore-page listing. Only PUBLISHED + PUBLIC forms surface here;
     * UNLISTED forms are reachable only by direct link.
     */
    public async listPublicForms(payload: ListPublicFormsInputType) {
        const { limit, offset } = await listPublicFormsInput.parseAsync(payload);

        return db
            .select({
                id: formsTable.id,
                title: formsTable.title,
                description: formsTable.description,
                theme: formsTable.theme,
                publishedAt: formsTable.publishedAt,
                creatorName: usersTable.fullName,
            })
            .from(formsTable)
            .innerJoin(usersTable, eq(formsTable.createdBy, usersTable.id))
            .where(
                and(
                    eq(formsTable.status, "PUBLISHED"),
                    eq(formsTable.visibility, "PUBLIC"),
                    isNull(formsTable.deletedAt),
                ),
            )
            .orderBy(desc(formsTable.publishedAt))
            .limit(limit)
            .offset(offset);
    }
}

export default FormService;
