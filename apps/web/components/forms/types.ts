import type { RouterOutputs } from "@repo/trpc/client";

export const FieldTypes = [
    "short_text",
    "long_text",
    "email",
    "number",
    "single_choice",
    "multi_choice",
    "rating",
    "yes_no",
    "password",
] as const;
export type FieldType = (typeof FieldTypes)[number];

export type FormStatus = RouterOutputs["form"]["getMyFormById"]["status"];
export type FormVisibility = RouterOutputs["form"]["getMyFormById"]["visibility"];

export interface FormFieldOption {
    id?: string;
    label: string;
    valueKey?: string;
    index?: number;
}

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    labelKey?: string;
    description?: string;
    placeholder?: string;
    required: boolean;
    options?: FormFieldOption[];
    min?: number;
    max?: number;
    /** Sort order — supports fractional values (1.00, 1.50, 2.00, …). */
    index?: number;
}

/** UI theme ids (lowercase). API uses GRASS | STONE | NETHER | END — see `lib/forms/mappers`. */
export type ThemeName = "grass" | "stone" | "nether" | "end";
export type ApiFormTheme = RouterOutputs["form"]["getMyFormById"]["theme"];

export interface FormDoc {
    id: string;
    title: string;
    description: string;
    fields: FormField[];
    theme: ThemeName;
    published: boolean;
    status: FormStatus;
    visibility: FormVisibility;
    requiresLogin: boolean;
    hasPassword: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface ResponseDoc {
    id: string;
    formId: string;
    submittedAt: number;
    values: Record<string, unknown>;
}

export const FIELD_LABELS: Record<FieldType, string> = {
    short_text: "Short text",
    long_text: "Long text",
    email: "Email",
    number: "Number",
    single_choice: "Single choice",
    multi_choice: "Multi choice",
    rating: "Rating (1-5)",
    yes_no: "Yes / No",
    password: "Password",
};

export const themeStyles: Record<ThemeName, { bg: string; accent: string; label: string }> = {
    grass: {
        bg: "from-emerald-100 to-lime-50",
        accent: "var(--grass)",
        label: "Overworld",
    },
    stone: {
        bg: "from-slate-100 to-zinc-50",
        accent: "var(--stone)",
        label: "Caves",
    },
    nether: {
        bg: "from-red-100 to-orange-50",
        accent: "var(--redstone)",
        label: "Nether",
    },
    end: {
        bg: "from-violet-100 to-indigo-50",
        accent: "var(--diamond)",
        label: "The End",
    },
};
