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
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center bg-mc-sky px-4 py-12">
                <div className="w-full max-w-md">
                    <ResetPasswordForm token={tokenValue ?? null} />
                </div>
            </section>
        </SiteLayout>
    );
}
