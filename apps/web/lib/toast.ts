import { toast as sonnerToast } from "sonner";

/** Project toasts — styled via `.mc-toast` in globals.css */
export const toast = {
    success: (message: string) => sonnerToast.success(message),
    error: (message: string) => sonnerToast.error(message),
    info: (message: string) => sonnerToast.info(message),
};
