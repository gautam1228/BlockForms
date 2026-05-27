import { AuthPageShell } from "~/components/auth-page-shell";
import { ForgotPasswordSent } from "~/components/forgot-password-sent";
import { SiteLayout } from "~/components/site-layout";

type ForgotPasswordSentPageProps = {
    searchParams: Promise<{ email?: string | string[] }>;
};

export default async function ForgotPasswordSentPage({
    searchParams,
}: ForgotPasswordSentPageProps) {
    const { email } = await searchParams;
    const maskedEmail = Array.isArray(email) ? email[0] : email;

    return (
        <SiteLayout hideFooter>
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <ForgotPasswordSent maskedEmail={maskedEmail ?? null} />
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
