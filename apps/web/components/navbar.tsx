"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MusicControls } from "~/components/music-controls";
import { UserProfileMenu } from "~/components/user-profile-menu";
import { Button } from "~/components/ui/button";
import { useAuthStatus } from "~/hooks/auth/use-auth-status";

type NavItem = { to: string; label: string };

const PUBLIC_NAV: NavItem[] = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/featured", label: "Featured" },
];

const AUTHED_NAV: NavItem[] = [...PUBLIC_NAV, { to: "/dashboard", label: "Dashboard" }];

export function Navbar() {
    const path = usePathname() ?? "/";
    const { showGuestAuth, showAuthedNav } = useAuthStatus();

    const navItems = showAuthedNav ? AUTHED_NAV : PUBLIC_NAV;

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <Image
                        src="/logo.png"
                        alt="BlockForms"
                        width={36}
                        height={36}
                        className="h-9 w-9 pixelated"
                        priority
                    />
                    <div className="leading-tight hidden sm:block">
                        <div className="font-pixel text-[10px] tracking-wider text-primary">
                            BLOCKFORMS
                        </div>
                        <div className="font-mc text-xs text-muted-foreground -mt-0.5">
                            build · publish · collect
                        </div>
                    </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((n) => {
                        const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
                        return (
                            <Link
                                key={n.to}
                                href={n.to}
                                className={`font-mc text-lg px-3 py-1.5 rounded-sm transition-colors ${
                                    active
                                        ? "bg-accent text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                                }`}
                            >
                                {n.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <MusicControls />
                    {showGuestAuth && (
                        <>
                            <Link href="/login" className="hidden sm:inline-flex">
                                <Button variant="ghost" className="font-mc text-base">
                                    Log in
                                </Button>
                            </Link>
                            <Link href="/signup">
                                <button
                                    type="button"
                                    className="mc-block bg-grass text-primary-foreground px-4 h-9 font-pixel text-[10px]"
                                >
                                    SIGN UP
                                </button>
                            </Link>
                        </>
                    )}

                    <UserProfileMenu />
                </div>
            </div>
        </header>
    );
}
