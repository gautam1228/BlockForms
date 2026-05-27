import { z } from "zod";

import {
    createDraftFormInput,
    deleteFormInput,
    fieldTypeSchema,
    formStatusSchema,
    formThemeSchema,
    formVisibilitySchema,
    getFormByIdInput,
    getPublishedFormByIdInput,
    listPublicFormsInput,
    publishFormInput,
    saveDraftFormInput,
    unpublishFormInput,
    updateFormSettingsInput,
    updateFormVisibilityInput,
} from "@repo/services/form/model";

// Input contracts are identical to the service-layer contracts (the service is
// the source of truth for shape and validation). We re-export under the
// `…InputModel` naming convention used throughout the trpc layer so the route
// file reads the same as `auth/route.ts`. All inputs are plain ZodObjects --
// trpc-to-openapi calls `.omit()` on them internally, which would fail on a
// `ZodEffects` (the type returned by `.refine()`).
export const createDraftFormInputModel = createDraftFormInput;
export const saveDraftFormInputModel = saveDraftFormInput;
export const publishFormInputModel = publishFormInput;
export const unpublishFormInputModel = unpublishFormInput;
export const updateFormVisibilityInputModel = updateFormVisibilityInput;
export const updateFormSettingsInputModel = updateFormSettingsInput;
export const deleteFormInputModel = deleteFormInput;
export const getFormByIdInputModel = getFormByIdInput;
export const getPublishedFormByIdInputModel = getPublishedFormByIdInput;
export const listPublicFormsInputModel = listPublicFormsInput;
export const listMyFormsInputModel = z.object({});

// Output models. Defined here (not in the service) so the API contract
// can evolve independently of internal service return shapes.

const formIdShape = z.object({
    id: z.uuid().describe("ID of the form"),
});

const formMetaOutputModel = z.object({
    id: z.uuid().describe("ID of the form"),
    title: z.string().describe("Title of the form"),
    description: z.string().nullable().describe("Optional description of the form"),
    status: formStatusSchema.describe("Lifecycle state of the form"),
    visibility: formVisibilitySchema.describe("Who can discover the form once published"),
    theme: formThemeSchema.describe("Visual theme for the public submission page"),
    requiresLogin: z
        .boolean()
        .describe("Whether respondents must be signed in to open/submit the form"),
    hasPassword: z.boolean().describe("Whether the form is gated by a shared-secret password"),
    publishedAt: z
        .date()
        .nullable()
        .describe("When the form was first published (null while DRAFT)"),
    createdAt: z.date().describe("When the form was created"),
    updatedAt: z.date().describe("When the form was last updated"),
});

const formFieldOptionOutputModel = z.object({
    id: z.uuid().describe("ID of the option"),
    label: z.string().describe("Human-readable option label"),
    valueKey: z.string().describe("Stable export/analytics key"),
    index: z.number().describe("Ordering index within the field"),
});

const formFieldOutputModel = z.object({
    id: z.uuid().describe("ID of the field"),
    type: fieldTypeSchema.describe("Field type"),
    label: z.string().describe("Human-readable field label"),
    labelKey: z.string().describe("Stable export/analytics key"),
    description: z.string().nullable().describe("Optional helper text shown to the respondent"),
    placeholder: z.string().nullable().describe("Optional placeholder shown inside the input"),
    isRequired: z.boolean().describe("Whether the respondent must answer this field"),
    index: z.number().describe("Ordering index within the form"),
    config: z
        .record(z.string(), z.unknown())
        .describe("Type-specific configuration (NUMBER min/max, RATING max, etc.)"),
    options: z
        .array(formFieldOptionOutputModel)
        .describe("Choices for SINGLE_CHOICE / MULTI_CHOICE fields (empty otherwise)"),
});

export const createDraftFormOutputModel = formMetaOutputModel;

export const saveDraftFormOutputModel = z.object({
    id: z.uuid().describe("ID of the saved form"),
    savedAt: z.date().describe("Server time the draft was persisted"),
});

export const publishFormOutputModel = z.object({
    id: z.uuid(),
    status: formStatusSchema,
    visibility: formVisibilitySchema,
    publishedAt: z.date().nullable(),
});

export const unpublishFormOutputModel = z.object({
    id: z.uuid(),
    status: formStatusSchema,
    visibility: formVisibilitySchema,
});

export const updateFormVisibilityOutputModel = z.object({
    id: z.uuid(),
    status: formStatusSchema,
    visibility: formVisibilitySchema,
});

export const updateFormSettingsOutputModel = z.object({
    id: z.uuid(),
    requiresLogin: z.boolean(),
    theme: formThemeSchema,
    hasPassword: z.boolean(),
});

export const deleteFormOutputModel = formIdShape;

export const formDetailOutputModel = formMetaOutputModel.extend({
    createdBy: z.uuid().describe("ID of the user that owns the form"),
    fields: z.array(formFieldOutputModel).describe("Fields in display order"),
});

export const getMyFormByIdOutputModel = formDetailOutputModel;

// Public submission-page response. Always returns metadata + gate flags so
// the client can render the right UI (sign-in prompt, password prompt). The
// `fields` array is only populated when `accessGranted = true`.
export const getPublishedFormByIdOutputModel = formMetaOutputModel.extend({
    createdBy: z.uuid(),
    accessGranted: z
        .boolean()
        .describe("True when the caller satisfied all gates (login + password)"),
    fields: z.array(formFieldOutputModel).describe("Empty until the caller satisfies all gates"),
});

export const listMyFormsOutputModel = z.object({
    items: z.array(formMetaOutputModel).describe("Forms owned by the signed-in user"),
});

export const listPublicFormsOutputModel = z.object({
    items: z
        .array(
            z.object({
                id: z.uuid(),
                title: z.string(),
                description: z.string().nullable(),
                theme: formThemeSchema,
                publishedAt: z.date().nullable(),
                creatorName: z.string(),
            }),
        )
        .describe("Forms published with PUBLIC visibility"),
});
