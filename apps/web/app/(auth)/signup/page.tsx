import { AuthPageShell } from "~/components/auth-page-shell";
import { SignupForm } from "~/components/signup-form";
import { SiteLayout } from "~/components/site-layout";

export default function SignupPage() {
    return (
        <SiteLayout hideFooter>
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <SignupForm />
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
