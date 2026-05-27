"use client";

import { Github, Linkedin, Twitter } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { useAuthStatus } from "~/hooks/auth/use-auth-status";

/** Replace `#` with your profile URLs */
const SOCIAL_LINKS = {
    twitter: "https://x.com/gautamtam_",
    github: "https://github.com/gautamtam",
    linkedin: "https://www.linkedin.com/in/gautamsingh28/",
} as const;

const SOCIAL_ITEMS = [
    { href: SOCIAL_LINKS.twitter, label: "X", icon: Twitter },
    { href: SOCIAL_LINKS.github, label: "GitHub", icon: Github },
    { href: SOCIAL_LINKS.linkedin, label: "LinkedIn", icon: Linkedin },
] as const;

export function Footer() {
    const { showGuestAuth, showAuthedNav } = useAuthStatus();
    const year = new Date().getFullYear();

    return (
        <footer className="mc-footer-ground relative z-[1] mt-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
                <div className="flex flex-col sm:flex-row justify-between gap-6 text-sm">
                    <div>
                        <Link href="/" className="inline-block">
                            <Image
                                src="/logo_with_text.png"
                                alt="BlockForms"
                                width={280}
                                height={112}
                                className="h-[4.75rem] w-auto max-w-[min(100%,17.5rem)] object-contain object-left pixelated"
                            />
                        </Link>
                        <p className="font-mc text-base text-muted-foreground mt-3">
                            Crafted, block by block.
                        </p>
                    </div>
                    <div className="flex gap-6 font-mc text-base">
                        <Link href="/pricing" className="hover:text-primary">
                            Pricing
                        </Link>
                        <Link href="/featured" className="hover:text-primary">
                            Featured
                        </Link>
                        {showAuthedNav ? (
                            <Link href="/dashboard" className="hover:text-primary">
                                Dashboard
                            </Link>
                        ) : showGuestAuth ? (
                            <>
                                <Link href="/login" className="hover:text-primary">
                                    Log in
                                </Link>
                                <Link href="/signup" className="hover:text-primary">
                                    Sign up
                                </Link>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-[var(--footer-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mc text-sm text-muted-foreground">
                        © {year} BlockForms. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        {SOCIAL_ITEMS.map(({ href, label, icon: Icon }) => (
                            <a
                                key={label}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={label}
                                title={label}
                                className="mc-block mc-block-stone flex h-9 w-9 items-center justify-center bg-stone text-foreground transition-colors hover:text-primary"
                            >
                                <Icon className="h-4 w-4" aria-hidden />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
