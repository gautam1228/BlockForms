"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            theme="light"
            position="bottom-right"
            className="toaster group"
            closeButton
            toastOptions={{
                classNames: {
                    toast: "mc-toast",
                    title: "mc-toast-title",
                    description: "mc-toast-description",
                    success: "mc-toast-success",
                    error: "mc-toast-error",
                    info: "mc-toast-info",
                    closeButton: "mc-toast-close",
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
