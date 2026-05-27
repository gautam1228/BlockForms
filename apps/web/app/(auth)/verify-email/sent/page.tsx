import { AuthPageShell } from "~/components/auth-page-shell";
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
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <VerifyEmailSent maskedEmail={maskedEmail ?? null} />
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
