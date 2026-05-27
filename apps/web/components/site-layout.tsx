import { Navbar } from "./navbar";
import { Footer } from "./footer";

export function SiteLayout({
    children,
    hideFooter,
}: {
    children: React.ReactNode;
    hideFooter?: boolean;
}) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="relative z-[1] flex-1">{children}</main>
            {!hideFooter && <Footer />}
        </div>
    );
}
