"use client";

import type { ThemeName } from "~/components/forms/types";
import { FloatingBlocks } from "~/components/floating-blocks";

const sceneBackgrounds: Record<ThemeName, string> = {
    grass: "linear-gradient(180deg, oklch(0.85 0.1 230) 0%, oklch(0.92 0.06 220) 40%, var(--grass) 40%, var(--grass-dark) 48%, var(--dirt) 48% 100%)",
    stone: "linear-gradient(180deg, oklch(0.55 0.01 240) 0%, oklch(0.35 0.01 240) 100%)",
    nether: "linear-gradient(180deg, oklch(0.45 0.18 28) 0%, oklch(0.3 0.15 28) 100%)",
    end: "linear-gradient(180deg, oklch(0.28 0.08 290) 0%, oklch(0.18 0.08 290) 100%)",
};

/** Soft vignette / sky wash over the scene (not painted on individual blocks). */
const themeAtmosphere: Record<ThemeName, string> = {
    grass: "radial-gradient(ellipse 130% 70% at 50% -10%, oklch(0.95 0.06 220 / 0.55), transparent 55%), radial-gradient(ellipse 80% 40% at 85% 60%, oklch(0.7 0.12 142 / 0.12), transparent 50%)",
    stone: "radial-gradient(ellipse 100% 55% at 50% 100%, oklch(0.22 0.01 240 / 0.45), transparent 55%), radial-gradient(ellipse 60% 80% at 0% 50%, oklch(0.45 0.01 240 / 0.2), transparent 50%)",
    nether: "radial-gradient(ellipse 90% 50% at 50% 100%, oklch(0.35 0.2 28 / 0.45), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 30%, oklch(0.5 0.22 40 / 0.25), transparent 50%)",
    end: "radial-gradient(ellipse 70% 60% at 75% 15%, oklch(0.35 0.12 290 / 0.35), transparent 55%), radial-gradient(ellipse 100% 80% at 50% 100%, oklch(0.12 0.06 290 / 0.5), transparent 50%)",
};

const themeFallingBlocks: Record<ThemeName, { count: number; colors: string[] }> = {
    grass: {
        count: 10,
        colors: ["var(--grass)", "var(--dirt)", "var(--stone)", "var(--gold)"],
    },
    stone: {
        count: 10,
        colors: ["var(--stone)", "var(--stone-dark)", "var(--dirt)", "var(--gold)"],
    },
    nether: {
        count: 10,
        colors: ["var(--redstone)", "var(--gold)", "var(--dirt)", "var(--stone-dark)"],
    },
    end: {
        count: 12,
        colors: ["var(--diamond)", "var(--stone)", "var(--gold)", "var(--redstone)"],
    },
};

const themeAnchoredBlocks: Record<ThemeName, { colors: string[]; blockClass: string }> = {
    grass: {
        colors: ["var(--grass)", "var(--dirt)", "var(--stone)", "var(--gold)"],
        blockClass: "mc-block",
    },
    stone: {
        colors: ["var(--stone)", "var(--stone-dark)", "var(--dirt)"],
        blockClass: "mc-block mc-block-stone",
    },
    nether: {
        colors: ["var(--redstone)", "var(--gold)", "var(--stone-dark)"],
        blockClass: "mc-block",
    },
    end: {
        colors: ["var(--diamond)", "var(--stone)", "var(--gold)"],
        blockClass: "mc-block mc-block-diamond",
    },
};

const themeDividerClass: Record<ThemeName, string> = {
    grass: "mc-grass-divider",
    stone: "mc-stone-divider",
    nether: "mc-nether-divider",
    end: "mc-end-divider",
};

/** Ground strip matching each biome (same style as landing grass divider). */
function ThemeGroundBar({ theme }: { theme: ThemeName }) {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 bottom-6 z-[5] flex justify-center px-4"
            aria-hidden
        >
            <div className={`mc-theme-divider ${themeDividerClass[theme]}`} />
        </div>
    );
}

/** Bobbing blocks hugging the form card (not the viewport edges). */
const formAnchorLayout = [
    { right: "-5%", top: "6%", size: 26 },
    { right: "-9%", top: "38%", size: 22 },
    { left: "-7%", top: "22%", size: 24 },
    { right: "-3%", bottom: "10%", size: 20 },
    { left: "-5%", bottom: "16%", size: 28 },
] as const;

function EndStars() {
    const stars = Array.from({ length: 24 }).map((_, i) => ({
        left: `${(i * 41) % 100}%`,
        top: `${(i * 29) % 70}%`,
        size: 3 + (i % 3),
        delay: `${(i * 0.7) % 4}s`,
    }));

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {stars.map((star, i) => (
                <div
                    key={i}
                    className="absolute rounded-sm bg-diamond/80 animate-mc-float"
                    style={{
                        left: star.left,
                        top: star.top,
                        width: star.size,
                        height: star.size,
                        animationDelay: star.delay,
                    }}
                />
            ))}
        </div>
    );
}

function NetherGlow() {
    return (
        <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
            aria-hidden
            style={{
                background:
                    "radial-gradient(ellipse at 50% 100%, rgba(255,100,40,0.35) 0%, transparent 70%)",
            }}
        />
    );
}

function FormAnchoredBlocks({ theme }: { theme: ThemeName }) {
    const { colors, blockClass } = themeAnchoredBlocks[theme];

    return (
        <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
            {formAnchorLayout.map((slot, i) => (
                <div
                    key={i}
                    className={`absolute animate-mc-float ${blockClass}`}
                    style={{
                        right: "right" in slot ? slot.right : undefined,
                        left: "left" in slot ? slot.left : undefined,
                        top: "top" in slot ? slot.top : undefined,
                        bottom: "bottom" in slot ? slot.bottom : undefined,
                        width: slot.size,
                        height: slot.size,
                        background: colors[i % colors.length]!,
                        opacity: 0.28 + (i % 3) * 0.06,
                        animationDelay: `${(i * 0.9) % 4}s`,
                        animationDuration: `${5.5 + (i % 2) * 1.2}s`,
                    }}
                />
            ))}
        </div>
    );
}

export function ThemeScene({
    theme,
    children,
    formAnchoredBlocks = false,
}: {
    theme: ThemeName;
    children: React.ReactNode;
    /** When true, bobbing blocks are placed beside the centered form card. */
    formAnchoredBlocks?: boolean;
}) {
    const falling = themeFallingBlocks[theme];

    return (
        <div
            className="relative z-[1] min-h-screen overflow-hidden"
            style={{ background: sceneBackgrounds[theme] }}
        >
            {theme === "nether" && <NetherGlow />}
            {theme === "end" && <EndStars />}
            <FloatingBlocks count={falling.count} colors={falling.colors} />
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{ background: themeAtmosphere[theme] }}
            />
            {formAnchoredBlocks && <ThemeGroundBar theme={theme} />}
            {formAnchoredBlocks ? (
                <div className="relative z-10 flex min-h-screen justify-center px-4 py-12 pb-20">
                    <div className="relative w-full max-w-2xl">
                        <FormAnchoredBlocks theme={theme} />
                        {children}
                    </div>
                </div>
            ) : (
                <div className="relative z-10">{children}</div>
            )}
        </div>
    );
}
