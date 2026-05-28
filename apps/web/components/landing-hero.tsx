"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { FloatingBlocks } from "~/components/floating-blocks";

const heroAtmosphere =
    "radial-gradient(ellipse 130% 70% at 50% -10%, oklch(0.95 0.06 220 / 0.55), transparent 55%), radial-gradient(ellipse 80% 40% at 85% 60%, oklch(0.7 0.12 142 / 0.12), transparent 50%), radial-gradient(ellipse 90% 50% at 50% 100%, oklch(0.75 0.1 142 / 0.08), transparent 60%)";

const heroBlockColors = ["var(--grass)", "var(--gold)", "var(--dirt)"];

export function LandingHero() {
    return (
        <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden">
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{ background: heroAtmosphere }}
            />

            <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-12 text-center sm:px-6 sm:py-16">
                <div className="relative z-10 mb-6 flex justify-center">
                    <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-sm mc-block mc-block-gold animate-mc-badge-pulse bg-gold px-3 py-1.5 whitespace-nowrap">
                        <Sparkles
                            className="h-3.5 w-3.5 shrink-0 animate-mc-badge-sparkle"
                            aria-hidden
                        />
                        <span className="font-pixel text-[9px] leading-none">
                            v1.0 · NOW IN BETA
                        </span>
                    </span>
                </div>

                <div className="relative isolate mx-auto w-full max-w-4xl">
                    <div
                        className="pointer-events-none absolute top-2 -right-10 -bottom-10 -left-10 sm:-right-16 sm:-bottom-12 sm:-left-16"
                        style={{
                            maskImage:
                                "radial-gradient(ellipse 88% 82% at 50% 58%, black 22%, transparent 72%)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse 88% 82% at 50% 58%, black 22%, transparent 72%)",
                        }}
                        aria-hidden
                    >
                        <FloatingBlocks count={3} colors={heroBlockColors} />
                    </div>

                    <div
                        className="pointer-events-none absolute top-0 -right-10 -bottom-10 -left-10 backdrop-blur-[2px] sm:-right-16 sm:-bottom-12 sm:-left-16 sm:backdrop-blur-sm"
                        style={{
                            maskImage:
                                "radial-gradient(ellipse 88% 82% at 50% 58%, black 28%, transparent 72%)",
                            WebkitMaskImage:
                                "radial-gradient(ellipse 88% 82% at 50% 58%, black 28%, transparent 72%)",
                        }}
                        aria-hidden
                    />

                    <div
                        className="pointer-events-none absolute top-0 -right-10 -bottom-10 -left-10 sm:-right-16 sm:-bottom-12 sm:-left-16"
                        style={{
                            background:
                                "radial-gradient(ellipse 90% 84% at 50% 58%, oklch(0.94 0.05 220 / 0.55) 0%, oklch(0.91 0.06 220 / 0.22) 48%, transparent 72%)",
                        }}
                        aria-hidden
                    />

                    <div className="relative px-2 py-8 sm:px-4 sm:py-10">
                        <h1 className="font-pixel text-2xl sm:text-4xl md:text-4xl leading-[1.4] text-balance">
                            <span className="block text-muted-foreground">
                                CRAFT FORMS & BUILD INSIGHTS.
                            </span>
                            <span className="mt-2 block text-primary sm:mt-3">BLOCK BY BLOCK.</span>
                        </h1>

                        <p className="font-mc text-xl sm:text-2xl text-muted-foreground mt-8 max-w-2xl mx-auto text-pretty">
                            Build interactive forms, publish in seconds, and track every response
                            like rare loot drops.
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Link href="/signup">
                        <button className="mc-block mc-cta bg-grass text-primary-foreground h-12 px-8 font-pixel text-xs">
                            START CRAFTING
                        </button>
                    </Link>
                    <Link href="/dashboard">
                        <button className="mc-block mc-cta mc-block-stone bg-stone h-12 px-6 font-pixel text-xs text-foreground">
                            OPEN INVENTORY
                        </button>
                    </Link>
                </div>
            </div>

            <div className="relative z-[1] mx-auto w-full max-w-6xl shrink-0 px-4 pb-10 sm:px-6 sm:pb-12">
                <div
                    className="mc-theme-divider mc-theme-divider--full mc-grass-divider"
                    aria-hidden
                />
            </div>
        </section>
    );
}
