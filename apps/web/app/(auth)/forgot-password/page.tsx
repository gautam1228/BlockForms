import { AuthPageShell } from "~/components/auth-page-shell";
import { ForgotPasswordForm } from "~/components/forgot-password-form";
import { SiteLayout } from "~/components/site-layout";

export default function ForgotPasswordPage() {
    return (
        <SiteLayout hideFooter>
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <ForgotPasswordForm />
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
