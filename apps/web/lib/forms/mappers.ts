import type { RouterOutputs } from "@repo/trpc/client";

import type { FieldType, FormDoc, FormField, ThemeName } from "~/components/forms/types";
import { ensureFieldIndices, initialFieldIndex, sortFieldsByIndex } from "~/lib/forms/field-index";

type ApiFieldType = RouterOutputs["form"]["getMyFormById"]["fields"][number]["type"];
type ApiFormTheme = RouterOutputs["form"]["getMyFormById"]["theme"];
type ApiFormDetail = RouterOutputs["form"]["getMyFormById"];
type ApiPublishedForm = RouterOutputs["form"]["getPublishedFormById"];
type ApiFormListItem = RouterOutputs["form"]["listMyForms"]["items"][number];

const API_TO_UI_FIELD_TYPE: Record<ApiFieldType, FieldType> = {
    SHORT_TEXT: "short_text",
    LONG_TEXT: "long_text",
    EMAIL: "email",
    NUMBER: "number",
    SINGLE_CHOICE: "single_choice",
    MULTI_CHOICE: "multi_choice",
    RATING: "rating",
    YES_NO: "yes_no",
    PASSWORD: "password",
};

const UI_TO_API_FIELD_TYPE: Record<FieldType, ApiFieldType> = {
    short_text: "SHORT_TEXT",
    long_text: "LONG_TEXT",
    email: "EMAIL",
    number: "NUMBER",
    single_choice: "SINGLE_CHOICE",
    multi_choice: "MULTI_CHOICE",
    rating: "RATING",
    yes_no: "YES_NO",
    password: "PASSWORD",
};

const API_TO_UI_THEME: Record<ApiFormTheme, ThemeName> = {
    GRASS: "grass",
    STONE: "stone",
    NETHER: "nether",
    END: "end",
};

const UI_TO_API_THEME: Record<ThemeName, ApiFormTheme> = {
    grass: "GRASS",
    stone: "STONE",
    nether: "NETHER",
    end: "END",
};

export function apiThemeToUi(theme: ApiFormTheme): ThemeName {
    return API_TO_UI_THEME[theme];
}

export function uiThemeToApi(theme: ThemeName): ApiFormTheme {
    return UI_TO_API_THEME[theme];
}

export function apiFieldTypeToUi(type: ApiFieldType): FieldType {
    return API_TO_UI_FIELD_TYPE[type];
}

export function uiFieldTypeToApi(type: FieldType): ApiFieldType {
    return UI_TO_API_FIELD_TYPE[type];
}

function toLabelKey(label: string, fallback: string): string {
    const base = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    const key = /^[a-z]/.test(base) ? base : `field_${base}`;
    return (key || fallback).slice(0, 100);
}

function mapApiFieldToUi(field: ApiFormDetail["fields"][number]): FormField {
    const config = (field.config ?? {}) as Record<string, unknown>;
    const ui: FormField = {
        id: field.id,
        type: apiFieldTypeToUi(field.type),
        label: field.label,
        labelKey: field.labelKey,
        description: field.description ?? undefined,
        placeholder: field.placeholder ?? undefined,
        required: field.isRequired,
        index: field.index,
        options: field.options.map((o) => ({
            id: o.id,
            label: o.label,
            valueKey: o.valueKey,
            index: o.index,
        })),
    };

    if (field.type === "NUMBER") {
        if (typeof config.min === "number") ui.min = config.min;
        if (typeof config.max === "number") ui.max = config.max;
    }

    return ui;
}

export function apiFormDetailToFormDoc(form: ApiFormDetail): FormDoc {
    return {
        id: form.id,
        title: form.title,
        description: form.description ?? "",
        fields: ensureFieldIndices(form.fields.map(mapApiFieldToUi)),
        theme: apiThemeToUi(form.theme),
        published: form.status === "PUBLISHED",
        status: form.status,
        visibility: form.visibility,
        requiresLogin: form.requiresLogin,
        hasPassword: form.hasPassword,
        createdAt: new Date(form.createdAt).getTime(),
        updatedAt: new Date(form.updatedAt).getTime(),
    };
}

export function apiPublishedFormToFormDoc(form: ApiPublishedForm): FormDoc {
    return {
        id: form.id,
        title: form.title,
        description: form.description ?? "",
        fields: form.fields.map(mapApiFieldToUi),
        theme: apiThemeToUi(form.theme),
        published: form.status === "PUBLISHED",
        status: form.status,
        visibility: form.visibility,
        requiresLogin: form.requiresLogin,
        hasPassword: form.hasPassword,
        createdAt: new Date(form.createdAt).getTime(),
        updatedAt: new Date(form.updatedAt).getTime(),
    };
}

export function apiListItemToFormDoc(item: ApiFormListItem): FormDoc {
    return {
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        fields: [],
        theme: apiThemeToUi(item.theme),
        published: item.status === "PUBLISHED",
        status: item.status,
        visibility: item.visibility,
        requiresLogin: item.requiresLogin,
        hasPassword: item.hasPassword,
        createdAt: new Date(item.createdAt).getTime(),
        updatedAt: new Date(item.updatedAt).getTime(),
    };
}

export function formDocToSaveDraftInput(form: FormDoc) {
    const orderedFields = sortFieldsByIndex(form.fields);

    return {
        id: form.id,
        title: form.title.trim() || "Untitled form",
        description: form.description.trim() || null,
        theme: uiThemeToApi(form.theme),
        fields: orderedFields.map((field, position) => {
            const labelKey = field.labelKey ?? toLabelKey(field.label, `field_${position + 1}`);
            const config: Record<string, unknown> = {};
            if (field.type === "number") {
                if (field.min !== undefined) config.min = field.min;
                if (field.max !== undefined) config.max = field.max;
            }

            const isChoice = field.type === "single_choice" || field.type === "multi_choice";

            const fieldIndex = field.index ?? initialFieldIndex(position);

            return {
                id: field.id.startsWith("f_") ? undefined : field.id,
                type: uiFieldTypeToApi(field.type),
                label: field.label,
                labelKey,
                description: field.description ?? null,
                placeholder: field.placeholder ?? null,
                isRequired: field.required,
                index: fieldIndex,
                config,
                options: isChoice
                    ? (field.options ?? []).map((opt, optIndex) => ({
                          id: opt.id?.startsWith("opt_") ? undefined : opt.id,
                          label: opt.label,
                          valueKey: opt.valueKey ?? toLabelKey(opt.label, `option_${optIndex + 1}`),
                          index: opt.index ?? optIndex + 1,
                      }))
                    : undefined,
            };
        }),
    };
}

export function buildSubmitAnswers(
    form: FormDoc,
    values: Record<string, unknown>,
): { fieldId: string; value: unknown }[] {
    const answers: { fieldId: string; value: unknown }[] = [];

    for (const field of form.fields) {
        const raw = values[field.id];
        const isMissing =
            raw === undefined ||
            raw === null ||
            raw === "" ||
            (Array.isArray(raw) && raw.length === 0);
        if (isMissing) continue;

        if (field.type === "number" || field.type === "rating") {
            answers.push({ fieldId: field.id, value: Number(raw) });
        } else if (field.type === "yes_no") {
            answers.push({ fieldId: field.id, value: Boolean(raw) });
        } else {
            answers.push({ fieldId: field.id, value: raw });
        }
    }

    return answers;
}
