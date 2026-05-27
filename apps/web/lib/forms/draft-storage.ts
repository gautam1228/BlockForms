import type { FormDoc } from "~/components/forms/types";
import { prepareFormDraftForStorage } from "~/lib/forms/field-index";

const DRAFT_KEY_PREFIX = "blockforms:form-draft:";

type StoredDraft = FormDoc & { _localSavedAt: number };

export function saveDraftToStorage(form: FormDoc) {
    if (typeof window === "undefined") return;
    const payload: StoredDraft = {
        ...prepareFormDraftForStorage(form),
        _localSavedAt: Date.now(),
    };
    try {
        localStorage.setItem(`${DRAFT_KEY_PREFIX}${form.id}`, JSON.stringify(payload));
    } catch {
        // Quota exceeded — ignore; user can still sync to DB manually.
    }
}

export function loadDraftFromStorage(formId: string): FormDoc | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${formId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredDraft;
        const { _localSavedAt, ...form } = parsed;
        void _localSavedAt;
        return prepareFormDraftForStorage(form);
    } catch {
        return null;
    }
}

export function clearDraftFromStorage(formId: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${formId}`);
}

export function getDraftLocalSavedAt(formId: string): number | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${formId}`);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredDraft;
        return parsed._localSavedAt ?? null;
    } catch {
        return null;
    }
}
