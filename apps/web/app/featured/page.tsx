"use client";

import Link from "next/link";
import { ExternalLink, Loader2, Sparkles } from "lucide-react";

import { themeStyles } from "~/components/forms/types";
import { SiteLayout } from "~/components/site-layout";
import { useListPublicForms } from "~/hooks/api/form";
import { apiThemeToUi } from "~/lib/forms/mappers";

export default function FeaturedPage() {
    const { forms, isLoading, isError, refetch } = useListPublicForms(24, 0);

    return (
        <SiteLayout>
            <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
                <div className="text-center mb-14">
                    <div className="font-pixel text-[10px] text-primary mb-3">{"// FEATURED"}</div>
                    <h1 className="font-pixel text-2xl sm:text-3xl">EXPLORE</h1>
                    <p className="font-mc text-xl text-muted-foreground mt-4">
                        Public forms published by the BlockForms community.
                    </p>
                </div>

                {isLoading ? (
                    <div className="py-16 grid place-items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : isError ? (
                    <div className="mc-panel rounded-md p-12 text-center">
                        <p className="font-mc text-lg text-muted-foreground">
                            Failed to load public forms.
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="mc-block bg-stone h-10 px-4 font-pixel text-[10px] mt-4"
                        >
                            RETRY
                        </button>
                    </div>
                ) : forms.length === 0 ? (
                    <div className="mc-panel rounded-md p-16 text-center">
                        <div className="mc-block bg-gold w-16 h-16 mx-auto mb-5 grid place-items-center">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="font-pixel text-sm">NO PUBLIC FORMS YET</h2>
                        <p className="font-mc text-lg text-muted-foreground mt-2 max-w-md mx-auto">
                            Publish a form with <strong>PUBLIC</strong> visibility to show it here.
                        </p>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-5">
                        {forms.map((f) => {
                            const theme = apiThemeToUi(f.theme);
                            const accent = themeStyles[theme].accent;
                            return (
                                <Link
                                    key={f.id}
                                    href={`/f/${f.id}`}
                                    className="mc-panel rounded-md p-6 hover:ring-2 hover:ring-primary/30 transition group"
                                >
                                    <div
                                        className="mc-block w-full h-1.5 mb-4 rounded-sm"
                                        style={{ background: accent }}
                                    />
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span
                                                    className="font-pixel text-[8px] shrink-0 px-1.5 py-0.5 rounded-sm text-white"
                                                    style={{ background: accent }}
                                                >
                                                    {themeStyles[theme].label.toUpperCase()}
                                                </span>
                                                <h2 className="font-pixel text-sm truncate group-hover:text-primary">
                                                    {f.title.toUpperCase()}
                                                </h2>
                                            </div>
                                            {f.description && (
                                                <p className="font-mc text-lg text-muted-foreground mt-2 line-clamp-2">
                                                    {f.description}
                                                </p>
                                            )}
                                            <p className="font-mc text-base text-muted-foreground mt-2">
                                                By: {f.creatorName}
                                            </p>
                                        </div>
                                        <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </div>
                                    {f.publishedAt && (
                                        <p className="font-mc text-sm text-muted-foreground mt-4">
                                            Published {new Date(f.publishedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}
