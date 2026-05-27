"use client";

import { FloatingBlocks } from "~/components/floating-blocks";

/** Site-wide ambient falling blocks — fixed behind all page content. */
export function FallingBlocksBackground() {
    return (
        <div
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-mc-sky"
            aria-hidden
        >
            <FloatingBlocks count={14} />
        </div>
    );
}
