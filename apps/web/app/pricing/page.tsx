"use client";

import { Check } from "lucide-react";
import { toast } from "sonner";

import { SiteLayout } from "~/components/site-layout";

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

export default function PricingPage() {
    return (
        <SiteLayout>
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
                <div className="text-center mb-14">
                    <div className="font-pixel text-[10px] text-primary mb-3">{"// PRICING"}</div>
                    <h1 className="font-pixel text-2xl sm:text-3xl">PICK YOUR TIER</h1>
                    <p className="font-mc text-xl text-muted-foreground mt-4">
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
        </SiteLayout>
    );
}
