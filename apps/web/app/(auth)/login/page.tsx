import { Suspense } from "react";

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
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center px-4 py-12">
                <div className="w-full max-w-sm md:max-w-4xl">
                    <Suspense fallback={<LoginFormFallback />}>
                        <LoginForm />
                    </Suspense>
                </div>
            </section>
        </SiteLayout>
    );
}
