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
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            {!hideFooter && <Footer />}
        </div>
    );
}
