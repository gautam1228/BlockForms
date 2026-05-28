"use client";

import Link from "next/link";
import {
    Pickaxe,
    Sparkles,
    Share2,
    BarChart3,
    ShieldCheck,
    Zap,
    Check,
    Trees,
    Mountain,
    Flame,
    Star,
} from "lucide-react";
import { toast } from "sonner";

import { LandingHero } from "~/components/landing-hero";
import { SiteLayout } from "~/components/site-layout";

const THEMES = [
    {
        name: "Overworld",
        tagline: "Grass, sun, good vibes.",
        icon: Trees,
        bg: "linear-gradient(180deg, oklch(0.85 0.1 230) 0%, oklch(0.92 0.06 220) 40%, var(--grass) 40%, var(--grass-dark) 48%, var(--dirt) 48% 100%)",
        block: "var(--grass)",
        chip: "bg-grass text-white",
    },
    {
        name: "Caves",
        tagline: "Cool stone, quiet depths.",
        icon: Mountain,
        bg: "linear-gradient(180deg, oklch(0.55 0.01 240) 0%, oklch(0.35 0.01 240) 100%)",
        block: "var(--stone)",
        chip: "bg-stone text-white",
    },
    {
        name: "Nether",
        tagline: "Hot, red, dangerous.",
        icon: Flame,
        bg: "linear-gradient(180deg, oklch(0.45 0.18 28) 0%, oklch(0.3 0.15 28) 100%)",
        block: "var(--redstone)",
        chip: "bg-redstone text-white",
    },
    {
        name: "The End",
        tagline: "Void purple, ender chill.",
        icon: Star,
        bg: "linear-gradient(180deg, oklch(0.28 0.08 290) 0%, oklch(0.18 0.08 290) 100%)",
        block: "var(--diamond)",
        chip: "bg-diamond text-white",
    },
];

const TIERS = [
    {
        name: "Wood",
        price: "$0",
        period: "forever",
        color: "var(--dirt)",
        features: ["3 forms", "100 responses / mo", "Basic themes", "Public share links"],
        cta: "Start free",
    },
    {
        name: "Iron",
        price: "$19",
        period: "per month",
        color: "var(--stone)",
        features: [
            "Unlimited forms",
            "10k responses / mo",
            "All themes",
            "CSV export",
            "Custom branding",
        ],
        cta: "Coming soon",
        featured: true,
    },
    {
        name: "Diamond",
        price: "$49",
        period: "per month",
        color: "var(--diamond)",
        features: ["Everything in Iron", "Webhooks & API", "Team seats", "Priority support", "SLA"],
        cta: "Coming soon",
    },
];

export default function Landing() {
    return (
        <SiteLayout>
            <LandingHero />

            {/* FEATURES */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
                <div className="text-center mb-14">
                    <div className="font-pixel text-[10px] text-primary mb-3">{"// FEATURES"}</div>
                    <h2 className="font-pixel text-xl sm:text-2xl">EVERYTHING YOU NEED</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            icon: Pickaxe,
                            title: "Dynamic builder",
                            body: "Drag, drop and configure 7 field types with full validation rules.",
                            color: "var(--grass)",
                        },
                        {
                            icon: Share2,
                            title: "Shareable links",
                            body: "Publish a form and share a link — respondents fill it without an account.",
                            color: "var(--diamond)",
                        },
                        {
                            icon: BarChart3,
                            title: "Live analytics",
                            body: "Track views, completions and drop-offs with pixel-perfect charts.",
                            color: "var(--gold)",
                        },
                        {
                            icon: ShieldCheck,
                            title: "Zod validation",
                            body: "Every form compiles to a Zod schema — type-safe end to end.",
                            color: "var(--redstone)",
                        },
                        {
                            icon: Sparkles,
                            title: "Themes",
                            body: "Overworld, Caves, Nether, The End — pick a vibe for each form.",
                            color: "var(--dirt)",
                        },
                        {
                            icon: Zap,
                            title: "Fast as TNT",
                            body: "No reload form filling. Instant submit. Auto-saved drafts.",
                            color: "var(--stone)",
                        },
                    ].map(({ icon: Icon, title, body, color }) => (
                        <div key={title} className="mc-panel p-6 rounded-md">
                            <div
                                className="mc-block w-12 h-12 grid place-items-center mb-4"
                                style={{ background: color }}
                            >
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="font-pixel text-xs mb-2">{title.toUpperCase()}</h3>
                            <p className="font-mc text-lg text-muted-foreground leading-snug">
                                {body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* THEMES SHOWCASE */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-10">
                <div className="text-center mb-12">
                    <div className="font-pixel text-[10px] text-primary mb-3">
                        {"// FOUR DIMENSIONS"}
                    </div>
                    <h2 className="font-pixel text-xl sm:text-2xl">PICK YOUR BIOME</h2>
                    <p className="font-mc text-xl text-muted-foreground mt-3">
                        Every form can wear a different skin.
                    </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {THEMES.map(({ name, tagline, icon: Icon, bg, block, chip }) => (
                        <div
                            key={name}
                            className="mc-panel rounded-md overflow-hidden flex flex-col"
                        >
                            <div
                                className="relative h-44 overflow-hidden"
                                style={{ background: bg }}
                            >
                                <div className="absolute inset-0 grid place-items-center">
                                    <div
                                        className="mc-block grid place-items-center w-16 h-16 animate-mc-float"
                                        style={{ background: block }}
                                    >
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <span
                                    className={`absolute top-2 left-2 font-pixel text-[8px] px-2 py-1 ${chip}`}
                                >
                                    {name.toUpperCase()}
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="font-pixel text-xs">{name.toUpperCase()}</div>
                                <p className="font-mc text-lg text-muted-foreground mt-1">
                                    {tagline}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* PRICING */}
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
                <div className="text-center mb-12">
                    <div className="font-pixel text-[10px] text-primary mb-3">{"// PRICING"}</div>
                    <h2 className="font-pixel text-xl sm:text-2xl">PICK YOUR TIER</h2>
                    <p className="font-mc text-xl text-muted-foreground mt-3">
                        Simple. Honest. No fine print.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    {TIERS.map((t) => (
                        <div
                            key={t.name}
                            className={`mc-panel p-7 rounded-md flex flex-col ${
                                t.featured ? "ring-2 ring-primary scale-[1.02]" : ""
                            }`}
                        >
                            <div
                                className="mc-block w-12 h-12 mb-4"
                                style={{ background: t.color }}
                            />
                            <div className="font-pixel text-sm">{t.name.toUpperCase()}</div>
                            <div className="mt-4 flex items-baseline gap-2">
                                <span className="font-pixel text-3xl">{t.price}</span>
                                <span className="font-mc text-lg text-muted-foreground">
                                    / {t.period}
                                </span>
                            </div>
                            <ul className="mt-6 space-y-2 flex-1">
                                {t.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 font-mc text-lg">
                                        <Check className="h-4 w-4 mt-1.5 text-primary shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() =>
                                    toast.info("Coming soon — billing arrives next sprint.")
                                }
                                className="mc-block bg-grass text-primary-foreground h-11 mt-7 font-pixel text-[10px]"
                            >
                                {t.cta.toUpperCase()}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-4xl px-4 sm:px-6 pb-20">
                <div className="mc-panel p-10 rounded-md text-center bg-linear-to-br from-emerald-50 to-amber-50">
                    <h3 className="font-pixel text-lg">READY TO MINE FEEDBACK?</h3>
                    <p className="font-mc text-xl text-muted-foreground mt-3">
                        Free during beta. No credit card.
                    </p>
                    <Link href="/signup" className="inline-block mt-6">
                        <button className="mc-block bg-grass text-primary-foreground h-12 px-8 font-pixel text-xs">
                            CREATE FREE ACCOUNT
                        </button>
                    </Link>
                </div>
            </section>
        </SiteLayout>
    );
}
