import { VerifyEmailSent } from "~/components/verify-email-sent";
import { SiteLayout } from "~/components/site-layout";

type VerifyEmailSentPageProps = {
    searchParams: Promise<{ email?: string | string[] }>;
};

export default async function VerifyEmailSentPage({ searchParams }: VerifyEmailSentPageProps) {
    const { email } = await searchParams;
    const maskedEmail = Array.isArray(email) ? email[0] : email;

    return (
        <SiteLayout hideFooter>
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center px-4 py-12">
                <div className="w-full max-w-md">
                    <VerifyEmailSent maskedEmail={maskedEmail ?? null} />
                </div>
            </section>
        </SiteLayout>
    );
}
