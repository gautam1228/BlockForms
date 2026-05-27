import { VerifyEmailRunner } from "~/components/verify-email-runner";
import { SiteLayout } from "~/components/site-layout";

type VerifyEmailPageProps = {
    searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
    const { token } = await searchParams;
    const tokenValue = Array.isArray(token) ? token[0] : token;

    return (
        <SiteLayout hideFooter>
            <section className="min-h-[calc(100svh-4rem)] grid place-items-center bg-mc-sky px-4 py-12">
                <div className="w-full max-w-md">
                    <VerifyEmailRunner token={tokenValue ?? null} />
                </div>
            </section>
        </SiteLayout>
    );
}
