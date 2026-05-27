import Link from "next/link";

import { SiteLayout } from "~/components/site-layout";

type LegalDocumentProps = {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
};

export function LegalDocument({ title, lastUpdated, children }: LegalDocumentProps) {
    return (
        <SiteLayout>
            <article className="relative z-[1] mx-auto max-w-3xl px-4 sm:px-6 py-12 pb-20">
                <p className="font-pixel text-[10px] text-primary mb-2">// LEGAL</p>
                <h1 className="font-pixel text-xl sm:text-2xl">{title}</h1>
                <p className="font-mc text-base text-muted-foreground mt-2">
                    Last updated: {lastUpdated}
                </p>
                <div className="mc-panel mt-8 space-y-6 rounded-md p-6 sm:p-8 font-mc text-lg leading-relaxed text-foreground">
                    {children}
                </div>
                <p className="font-mc text-base text-muted-foreground mt-8 text-center">
                    <Link href="/" className="text-primary underline underline-offset-2">
                        Back to home
                    </Link>
                </p>
            </article>
        </SiteLayout>
    );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section>
            <h2 className="font-pixel text-xs mb-3">{title}</h2>
            <div className="space-y-3 text-muted-foreground">{children}</div>
        </section>
    );
}

export { LegalSection };
