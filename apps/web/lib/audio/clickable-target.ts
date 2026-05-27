const CLICKABLE_SELECTOR = [
    "a[href]",
    "button:not(:disabled)",
    "input[type='submit']:not(:disabled)",
    "input[type='button']:not(:disabled)",
    "input[type='reset']:not(:disabled)",
    "input[type='checkbox']:not(:disabled)",
    "input[type='radio']:not(:disabled)",
    "select:not(:disabled)",
    "summary",
    "label:has(input[type='checkbox'], input[type='radio'])",
    "[role='button']:not([aria-disabled='true']):not([data-disabled])",
    "[role='link']",
    "[role='menuitem']",
    "[role='option']",
    "[role='tab']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='switch']",
    "[role='combobox']",
].join(", ");

const TEXT_FIELD_SELECTOR =
    "input[type='text'], input[type='email'], input[type='password'], input[type='number'], input[type='search'], input[type='tel'], input[type='url'], textarea";

/** Returns the nearest clickable element for UI click SFX, or null. */
export function findClickableTarget(target: Element): Element | null {
    if (target.closest(TEXT_FIELD_SELECTOR)) return null;
    return target.closest(CLICKABLE_SELECTOR);
}
