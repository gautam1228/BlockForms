import Link from "next/link";
import { MapPinOff } from "lucide-react";

import { FloatingBlocks } from "~/components/floating-blocks";
import { SiteLayout } from "~/components/site-layout";

export default function NotFound() {
    return (
        <SiteLayout>
            <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-mc-sky px-4">
                <FloatingBlocks count={14} />
                <div className="relative z-10 mx-auto max-w-lg text-center">
                    <div className="mc-block mx-auto mb-6 grid h-16 w-16 place-items-center bg-redstone">
                        <MapPinOff className="h-7 w-7 text-white" aria-hidden />
                    </div>
                    <p className="font-pixel text-[10px] tracking-wider text-primary">ERROR 404</p>
                    <h1 className="font-pixel mt-4 text-xl sm:text-2xl leading-relaxed text-foreground">
                        CHUNK NOT FOUND
                    </h1>
                    <p className="font-mc mt-4 text-xl text-muted-foreground">
                        This path hasn&apos;t been mined yet. The block you&apos;re looking for
                        doesn&apos;t exist or was moved.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                        <Link href="/">
                            <button
                                type="button"
                                className="mc-block h-12 bg-grass px-6 font-pixel text-[10px] text-primary-foreground"
                            >
                                BACK TO HOME
                            </button>
                        </Link>
                        <Link href="/featured">
                            <button
                                type="button"
                                className="mc-block mc-block-stone h-12 bg-stone px-6 font-pixel text-[10px] text-foreground"
                            >
                                BROWSE FORMS
                            </button>
                        </Link>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-4 bg-grass-block" aria-hidden />
            </section>
        </SiteLayout>
    );
}
