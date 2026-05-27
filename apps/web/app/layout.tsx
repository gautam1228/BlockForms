import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { GlobalProviders } from "~/providers/global";
import { Manrope, JetBrains_Mono, Roboto_Slab, Press_Start_2P, VT323 } from "next/font/google";
import { cn } from "~/lib/utils";

const robotoSlab = Roboto_Slab({ subsets: ["latin"], variable: "--font-serif" });

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const pressStart2P = Press_Start_2P({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-pixel",
});

const vt323 = VT323({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-mc",
});

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
});

export const metadata: Metadata = {
    title: "BlockForms",
    description: "Craft forms, block by block.",
    icons: {
        icon: [{ url: "/logo.png", type: "image/png" }],
        apple: "/logo.png",
        shortcut: "/logo.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn(
                manrope.variable,
                jetbrainsMono.variable,
                robotoSlab.variable,
                pressStart2P.variable,
                vt323.variable,
                "font-sans",
            )}
        >
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <GlobalProviders>{children}</GlobalProviders>
            </body>
        </html>
    );
}
