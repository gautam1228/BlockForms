import { toast } from "~/lib/toast";
import { isRateLimitError, userErrorMessage } from "~/lib/user-error";

/**
 * Toast for action failures. Rate-limit toasts are handled globally by the tRPC
 * link; this avoids showing the same message twice in catch blocks.
 */
export function notifyActionError(error: unknown, fallback: string) {
    if (isRateLimitError(error)) return;
    toast.error(userErrorMessage(error, fallback));
}
