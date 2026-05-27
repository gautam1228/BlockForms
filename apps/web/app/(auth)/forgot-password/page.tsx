import { ForgotPasswordForm } from "~/components/forgot-password-form";
import { SiteLayout } from "~/components/site-layout";

export default function ForgotPasswordPage() {
    return (
        <SiteLayout hideFooter>
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center bg-mc-sky px-4 py-12">
                <div className="w-full max-w-md">
                    <ForgotPasswordForm />
                </div>
            </section>
        </SiteLayout>
    );
}
