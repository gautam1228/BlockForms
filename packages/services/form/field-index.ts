/** Fractional index helpers shared by the form service layer. */

export function roundFieldIndex(value: number): number {
    return Math.round(value * 100) / 100;
}

export function formatFieldIndex(value: number): string {
    return roundFieldIndex(value).toFixed(2);
}

/** Temporary indices during a transaction (9000.01, 9000.02, …). */
export function stagingFieldIndex(slot: number): string {
    return (9000 + (slot + 1) * 0.01).toFixed(2);
}

export function stagingOptionIndex(slot: number): string {
    return (9000 + (slot + 1) * 0.01).toFixed(2);
}

/** Assign 1.00, 2.00, … from payload order when no index is supplied. */
export function indexFromPayloadOrder(position: number): string {
    return formatFieldIndex(position + 1);
}
