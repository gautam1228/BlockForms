/** Session-only storage for form passwords (not persisted in localStorage). */

export function getStoredFormPassword(formId: string): string | undefined {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem(`blockforms:form-password:${formId}`) ?? undefined;
}

export function setStoredFormPassword(formId: string, password: string) {
    if (typeof window === "undefined") return;
    const key = `blockforms:form-password:${formId}`;
    if (!password) {
        sessionStorage.removeItem(key);
        return;
    }
    sessionStorage.setItem(key, password);
}
