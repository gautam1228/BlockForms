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

const themeAnchoredBlocks: Record<
    ThemeName,
    { count: number; colors: string[]; blockClass: string }
> = {
    grass: {
        count: 7,
        colors: ["var(--grass)", "var(--dirt)", "var(--stone)", "var(--gold)"],
        blockClass: "mc-block",
    },
    stone: {
        count: 8,
        colors: ["var(--stone)", "var(--stone-dark)", "var(--dirt)"],
        blockClass: "mc-block mc-block-stone",
    },
    nether: {
        count: 7,
        colors: ["var(--redstone)", "var(--gold)", "var(--stone-dark)"],
        blockClass: "mc-block",
    },
    end: {
        count: 8,
        colors: ["var(--diamond)", "var(--stone)", "var(--gold)"],
        blockClass: "mc-block mc-block-diamond",
    },
};

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

/** Blocks anchored on the right / edges that gently bob in place. */
function AnchoredFloatingBlocks({ theme }: { theme: ThemeName }) {
    const { count, colors, blockClass } = themeAnchoredBlocks[theme];

    const blocks = Array.from({ length: count }).map((_, i) => {
        const onRight = i % 3 !== 1;
        return {
            right: onRight ? `${((i * 11) % 30) + 4}%` : undefined,
            left: onRight ? undefined : `${((i * 9) % 18) + 2}%`,
            top: onRight ? `${((i * 17) % 62) + 12}%` : undefined,
            bottom: onRight ? undefined : `${((i * 8) % 28) + 6}%`,
            size: 22 + (i % 3) * 10,
            opacity: 0.22 + (i % 4) * 0.07,
            color: colors[i % colors.length]!,
            delay: `${(i * 0.85) % 4.5}s`,
            duration: 5.5 + (i % 3) * 1.2,
        };
    });

    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {blocks.map((block, i) => (
                <div
                    key={i}
                    className={`absolute animate-mc-float ${blockClass}`}
                    style={{
                        right: block.right,
                        left: block.left,
                        top: block.top,
                        bottom: block.bottom,
                        width: block.size,
                        height: block.size,
                        background: block.color,
                        opacity: block.opacity,
                        animationDelay: block.delay,
                        animationDuration: `${block.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}

export function ThemeScene({ theme, children }: { theme: ThemeName; children: React.ReactNode }) {
    const falling = themeFallingBlocks[theme];

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{ background: sceneBackgrounds[theme] }}
        >
            {theme === "nether" && <NetherGlow />}
            {theme === "end" && <EndStars />}
            <FloatingBlocks count={falling.count} colors={falling.colors} />
            <AnchoredFloatingBlocks theme={theme} />
            <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{ background: themeAtmosphere[theme] }}
            />
            <div className="relative z-10">{children}</div>
        </div>
    );
}
