import type { FormDoc, FormField } from "~/components/forms/types";

/** Step subtracted/added when moving a field past a neighbor (e.g. 1.00 → 0.90). */
export const REORDER_STEP = 0.1;

export function roundFieldIndex(value: number): number {
    return Math.round(value * 100) / 100;
}

/** Default index for position `i` in a freshly ordered list (1.00, 2.00, …). */
export function initialFieldIndex(position: number): number {
    return roundFieldIndex(position + 1);
}

export function sortFieldsByIndex(fields: FormField[]): FormField[] {
    return fields.slice().sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

/** Assigns 1.00, 2.00, … from the current visual order. */
export function renormalizeFieldIndices(fields: FormField[]): FormField[] {
    const sorted = sortFieldsByIndex(fields);
    return sorted.map((field, position) => ({
        ...field,
        index: initialFieldIndex(position),
    }));
}

export function ensureFieldIndices(fields: FormField[]): FormField[] {
    if (fields.length === 0) return fields;
    const missing = fields.some((f) => f.index === undefined);
    if (missing) return renormalizeFieldIndices(fields);
    return sortFieldsByIndex(fields);
}

export function indexForNewField(fields: FormField[]): number {
    if (fields.length === 0) return 1;
    const max = Math.max(...fields.map((f) => f.index ?? 0));
    return roundFieldIndex(max + 1);
}

function applyReorder(fields: FormField[], sortedIndex: number, direction: -1 | 1): FormField[] {
    const sorted = sortFieldsByIndex(fields);
    const next = sorted.slice();
    const [moved] = next.splice(sortedIndex, 1);
    if (!moved) return fields;
    next.splice(sortedIndex + direction, 0, moved);
    const renormalized = renormalizeFieldIndices(next);
    return fields.map((field) => {
        const updated = renormalized.find((f) => f.id === field.id);
        return updated ?? field;
    });
}

/**
 * Moves a field up/down by shifting its index ±0.10 relative to the neighbor
 * it swaps past (e.g. move to top before 1.00 → 0.90). Renormalizes to
 * 1.00, 2.00, … when there is no room left.
 */
export function moveFieldByIndex(
    fields: FormField[],
    sortedIndex: number,
    direction: -1 | 1,
): FormField[] {
    const sorted = sortFieldsByIndex(fields);
    const neighborIndex = sortedIndex + direction;
    if (neighborIndex < 0 || neighborIndex >= sorted.length) return fields;

    const moved = sorted[sortedIndex]!;
    const neighbor = sorted[neighborIndex]!;
    const neighborIdx = neighbor.index ?? initialFieldIndex(neighborIndex);

    const newIndex =
        direction === -1
            ? roundFieldIndex(neighborIdx - REORDER_STEP)
            : roundFieldIndex(neighborIdx + REORDER_STEP);

    if (newIndex <= 0) {
        return applyReorder(fields, sortedIndex, direction);
    }

    const taken = new Set(fields.filter((f) => f.id !== moved.id).map((f) => f.index));
    if (taken.has(newIndex)) {
        return applyReorder(fields, sortedIndex, direction);
    }

    return fields.map((field) => (field.id === moved.id ? { ...field, index: newIndex } : field));
}

/** Sorts by index and preserves fractional values (0.90, 1.00, …) for localStorage. */
export function prepareFormDraftForStorage(form: FormDoc): FormDoc {
    const fields = form.fields.some((f) => f.index === undefined)
        ? ensureFieldIndices(form.fields)
        : sortFieldsByIndex(form.fields);

    return { ...form, fields };
}
