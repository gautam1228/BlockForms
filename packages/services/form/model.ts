import { z } from "zod";

export const fieldTypeSchema = z.enum([
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
export type FieldType = z.infer<typeof fieldTypeSchema>;

export const formStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);
export type FormStatus = z.infer<typeof formStatusSchema>;

export const formVisibilitySchema = z.enum(["PUBLIC", "UNLISTED"]);
export type FormVisibility = z.infer<typeof formVisibilitySchema>;

export const formThemeSchema = z.enum(["GRASS", "STONE", "NETHER", "END"]);
export type FormTheme = z.infer<typeof formThemeSchema>;

// Stable identifier used by exports / analytics so that renaming a label does
// not break downstream consumers. Lowercase ascii, must start with a letter.
const keySchema = z
    .string()
    .min(1, "Key is required")
    .max(100, "Maximum 100 characters")
    .regex(
        /^[a-z][a-z0-9_]*$/,
        "Must start with a lowercase letter and contain only lowercase letters, numbers, and underscores",
    );

const titleSchema = z.string().trim().min(1, "Title is required").max(55, "Maximum 55 characters");

const descriptionSchema = z
    .string()
    .trim()
    .max(255, "Maximum 255 characters")
    .optional()
    .nullable();

// Field-level type-specific config (e.g. NUMBER min/max, RATING max stars,
// SHORT_TEXT pattern). We accept any record here; per-type rules can be added
// in the service layer once we ship more field types.
const fieldConfigSchema = z.record(z.string(), z.unknown()).default({});

export const formFieldOptionInput = z.object({
    id: z.uuid().optional().describe("Existing option id (omit when adding a brand new option)"),
    label: z.string().trim().min(1, "Option label is required").max(100, "Maximum 100 characters"),
    valueKey: keySchema.describe("Stable export/analytics key for this option"),
    index: z.number().nonnegative().describe("Ordering index within the field (e.g. 1.00, 1.50)"),
});
export type FormFieldOptionInputType = z.infer<typeof formFieldOptionInput>;

export const formFieldInput = z.object({
    id: z.uuid().optional().describe("Existing field id (omit when adding a brand new field)"),
    type: fieldTypeSchema,
    label: z.string().trim().min(1, "Field label is required").max(100, "Maximum 100 characters"),
    labelKey: keySchema.describe("Stable export/analytics key for this field"),
    description: z.string().trim().max(255).optional().nullable(),
    placeholder: z.string().trim().max(55).optional().nullable(),
    isRequired: z.boolean().default(false),
    index: z.number().nonnegative().describe("Ordering index within the form (e.g. 1.00, 1.50)"),
    config: fieldConfigSchema,
    options: z
        .array(formFieldOptionInput)
        .optional()
        .describe("Required for SINGLE_CHOICE / MULTI_CHOICE field types"),
});
export type FormFieldInputType = z.infer<typeof formFieldInput>;

export const createDraftFormInput = z.object({
    title: titleSchema.optional().describe("Initial title; defaults to 'Untitled form'"),
    description: descriptionSchema,
    theme: formThemeSchema
        .optional()
        .describe("Visual theme for the public submission page; defaults to GRASS"),
});
export type CreateDraftFormInputType = z.infer<typeof createDraftFormInput>;

export const saveDraftFormInput = z.object({
    id: z.uuid().describe("ID of the draft form to overwrite"),
    title: titleSchema,
    description: descriptionSchema,
    theme: formThemeSchema.describe("Visual theme for the public submission page"),
    fields: z.array(formFieldInput).max(200, "A form can have at most 200 fields"),
});
export type SaveDraftFormInputType = z.infer<typeof saveDraftFormInput>;

export const publishFormInput = z.object({
    id: z.uuid().describe("ID of the form to publish"),
    visibility: formVisibilitySchema
        .default("UNLISTED")
        .describe("Who can discover the form once published"),
});
export type PublishFormInputType = z.infer<typeof publishFormInput>;

export const unpublishFormInput = z.object({
    id: z.uuid().describe("ID of the form to unpublish"),
});
export type UnpublishFormInputType = z.infer<typeof unpublishFormInput>;

export const updateFormVisibilityInput = z.object({
    id: z.uuid().describe("ID of the published form"),
    visibility: formVisibilitySchema,
});
export type UpdateFormVisibilityInputType = z.infer<typeof updateFormVisibilityInput>;

export const deleteFormInput = z.object({
    id: z.uuid().describe("ID of the form to delete"),
});
export type DeleteFormInputType = z.infer<typeof deleteFormInput>;

export const getFormByIdInput = z.object({
    id: z.uuid().describe("ID of the form"),
});
export type GetFormByIdInputType = z.infer<typeof getFormByIdInput>;

// Public-facing read also accepts the shared-secret password for
// password-protected forms. When omitted (or wrong) the service returns the
// form's metadata with `accessGranted: false` and an empty `fields` array.
export const getPublishedFormByIdInput = z.object({
    id: z.uuid().describe("ID of the form"),
    password: z
        .string()
        .max(128)
        .optional()
        .describe("Shared-secret password for password-protected forms"),
});
export type GetPublishedFormByIdInputType = z.infer<typeof getPublishedFormByIdInput>;

// Form-level settings. Both fields are optional; absent = no change. For
// `password`, pass `null` to clear an existing password, a string to set/
// rotate it, or omit the field entirely to leave it untouched.
export const updateFormSettingsInput = z.object({
    id: z.uuid().describe("ID of the form"),
    requiresLogin: z
        .boolean()
        .optional()
        .describe("Whether respondents must be signed in to open/submit the form"),
    theme: formThemeSchema.optional().describe("Visual theme for the public submission page"),
    password: z
        .string()
        .min(4, "Minimum 4 characters")
        .max(128, "Maximum 128 characters")
        .nullable()
        .optional()
        .describe("New shared-secret password, or null to clear it"),
});
export type UpdateFormSettingsInputType = z.infer<typeof updateFormSettingsInput>;

export const listPublicFormsInput = z.object({
    limit: z.number().int().min(1).max(50).default(20),
    offset: z.number().int().min(0).default(0),
});
export type ListPublicFormsInputType = z.infer<typeof listPublicFormsInput>;
