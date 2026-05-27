import { Suspense } from "react";

import { AuthPageShell } from "~/components/auth-page-shell";
import { LoginForm } from "~/components/login-form";
import { SiteLayout } from "~/components/site-layout";

function LoginFormFallback() {
    return (
        <div className="mc-panel w-full max-w-sm rounded-md p-8 text-center md:max-w-md">
            <p className="font-mc text-lg text-muted-foreground">Loading…</p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <SiteLayout hideFooter>
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <Suspense fallback={<LoginFormFallback />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
