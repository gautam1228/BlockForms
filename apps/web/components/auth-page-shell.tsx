import { FloatingBlocks } from "~/components/floating-blocks";

/** Auth pages: sky + falling blocks behind the form card. */
export function AuthPageShell({ children }: { children: React.ReactNode }) {
    return (
        <section className="relative min-h-[calc(100svh-4rem)] overflow-hidden">
            <FloatingBlocks count={14} />
            <div className="relative z-[1] grid min-h-[calc(100svh-4rem)] place-items-center px-4 py-12">
                {children}
            </div>
        </section>
    );
}
