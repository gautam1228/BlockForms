import { SignupForm } from "~/components/signup-form";
import { SiteLayout } from "~/components/site-layout";

export default function SignupPage() {
    return (
        <SiteLayout hideFooter>
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center bg-mc-sky px-4 py-12">
                <div className="w-full max-w-sm md:max-w-4xl">
                    <SignupForm />
                </div>
            </section>
        </SiteLayout>
    );
}
