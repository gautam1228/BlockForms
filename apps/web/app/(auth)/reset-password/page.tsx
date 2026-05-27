import { AuthPageShell } from "~/components/auth-page-shell";
import { ResetPasswordForm } from "~/components/reset-password-form";
import { SiteLayout } from "~/components/site-layout";

type ResetPasswordPageProps = {
    searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
    const { token } = await searchParams;
    const tokenValue = Array.isArray(token) ? token[0] : token;

    return (
        <SiteLayout hideFooter>
            <AuthPageShell>
                <div className="w-full max-w-md">
                    <ResetPasswordForm token={tokenValue ?? null} />
                </div>
            </AuthPageShell>
        </SiteLayout>
    );
}
