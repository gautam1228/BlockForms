// Ambient falling pixel blocks for landing/hero and themed form backgrounds.

const DEFAULT_COLORS = [
    "var(--grass)",
    "var(--dirt)",
    "var(--stone)",
    "var(--gold)",
    "var(--diamond)",
    "var(--redstone)",
];

interface Props {
    count?: number;
    className?: string;
    /** Block fill colors — defaults to the full Minecraft palette. */
    colors?: string[];
    /** Semi-transparent gradient wash over the blocks to match a scene theme. */
    overlay?: string;
}

export function FloatingBlocks({
    count = 12,
    className = "",
    colors = DEFAULT_COLORS,
    overlay,
}: Props) {
    const palette = colors.length > 0 ? colors : DEFAULT_COLORS;

    const blocks = Array.from({ length: count }).map((_, i) => {
        const left = (i * 83) % 100;
        const size = 14 + ((i * 7) % 28);
        const duration = 8 + ((i * 3) % 10);
        const delay = (i * 1.3) % 7;
        const color = palette[i % palette.length];
        return (
            <div
                key={i}
                className="absolute animate-mc-fall"
                style={{
                    left: `${left}%`,
                    top: 0,
                    width: size,
                    height: size,
                    background: color,
                    border: "2px solid rgba(0,0,0,0.25)",
                    boxShadow:
                        "inset -2px -2px 0 0 rgba(0,0,0,0.25), inset 2px 2px 0 0 rgba(255,255,255,0.25)",
                    animationDuration: `${duration}s`,
                    animationDelay: `-${delay}s`,
                }}
            />
        );
    });

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
            aria-hidden
        >
            {blocks}
            {overlay ? <div className="absolute inset-0" style={{ background: overlay }} /> : null}
        </div>
    );
}
