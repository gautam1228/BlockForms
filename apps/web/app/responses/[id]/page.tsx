"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Loader2 } from "lucide-react";

import { ResponseAnalytics } from "~/components/forms/response-analytics";
import { SiteLayout } from "~/components/site-layout";
import type { FormDoc, ResponseDoc } from "~/components/forms/types";
import { useMyFormById } from "~/hooks/api/form";
import { type SubmissionDetail, useSubmissionsWithAnswers } from "~/hooks/api/submission";
import { useRequireAuth } from "~/hooks/auth/use-require-auth";
import { apiFormDetailToFormDoc } from "~/lib/forms/mappers";

export default function ResponsesPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const { isCheckingAuth, isAuthenticated } = useRequireAuth();
    const { data: formData, isLoading: isFormLoading, isError: isFormError } = useMyFormById(id);
    const {
        submissions,
        isLoading: isSubsLoading,
        isError: isSubsError,
    } = useSubmissionsWithAnswers(id);

    const form: FormDoc | null = useMemo(
        () => (formData ? apiFormDetailToFormDoc(formData) : null),
        [formData],
    );

    const items: ResponseDoc[] = useMemo(() => {
        if (!form) return [];
        return submissions.map((s: SubmissionDetail) => ({
            id: s.id,
            formId: s.formId,
            submittedAt: new Date(s.submittedAt).getTime(),
            values: Object.fromEntries(s.answers.map((a) => [a.formFieldId, a.value])),
        }));
    }, [form, submissions]);

    const stats = useMemo(() => {
        const last7 = items.filter((r) => r.submittedAt > Date.now() - 7 * 86400000).length;
        return {
            total: items.length,
            last7,
            avgFields: items.length
                ? Math.round(
                      items.reduce((a, r) => a + Object.keys(r.values).length, 0) / items.length,
                  )
                : 0,
        };
    }, [items]);

    if (isCheckingAuth || !isAuthenticated) {
        return (
            <SiteLayout>
                <div className="min-h-[40vh] grid place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SiteLayout>
        );
    }

    if (isFormLoading || isSubsLoading) {
        return (
            <SiteLayout>
                <div className="min-h-[40vh] grid place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SiteLayout>
        );
    }

    if (isFormError || isSubsError || !form) {
        return (
            <SiteLayout>
                <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                    <div className="mc-block bg-stone w-14 h-14 mx-auto mb-4" />
                    <h1 className="font-pixel text-base">RESPONSES</h1>
                    <p className="font-mc text-xl text-muted-foreground mt-2">
                        Could not load this form or its responses.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1 mt-6 font-mc text-base text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to dashboard
                    </Link>
                </div>
            </SiteLayout>
        );
    }

    const downloadCsv = () => {
        const cols = form.fields;
        const header = ["Submitted at", ...cols.map((c) => c.label)].join(",");
        const rows = items.map((r) => {
            const vals = cols.map((c) => {
                const v = r.values[c.id];
                const s = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
                return `"${s.replace(/"/g, '""')}"`;
            });
            return [new Date(r.submittedAt).toISOString(), ...vals].join(",");
        });
        const blob = new Blob([[header, ...rows].join("\n")], {
            type: "text/csv",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${form.title}-responses.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const labelForValue = (fieldId: string, value: unknown) => {
        const field = form.fields.find((f) => f.id === fieldId);
        if (!field) return value == null ? "—" : String(value);

        if (field.type === "single_choice" && typeof value === "string") {
            return field.options?.find((o) => o.id === value)?.label ?? value;
        }
        if (field.type === "multi_choice" && Array.isArray(value)) {
            return value
                .map((id) => field.options?.find((o) => o.id === id)?.label ?? String(id))
                .join(", ");
        }
        if (Array.isArray(value)) return value.join(", ");
        if (value == null || value === "") return "—";
        return String(value);
    };

    return (
        <SiteLayout>
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
                <Link
                    href="/dashboard"
                    className="font-mc text-base text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" /> Dashboard
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="font-pixel text-[10px] text-primary mb-2">
                            {"// RESPONSES"}
                        </div>
                        <h1 className="font-pixel text-xl sm:text-2xl">
                            {form.title.toUpperCase()}
                        </h1>
                    </div>
                    {items.length > 0 && (
                        <button
                            onClick={downloadCsv}
                            className="mc-block mc-block-stone bg-stone h-10 px-4 font-pixel text-[10px] inline-flex items-center gap-2"
                        >
                            <Download className="h-3.5 w-3.5" /> EXPORT CSV
                        </button>
                    )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <Stat label="Total" value={stats.total} color="var(--grass)" />
                    <Stat label="Last 7 days" value={stats.last7} color="var(--diamond)" />
                    <Stat label="Avg fields filled" value={stats.avgFields} color="var(--gold)" />
                </div>

                <ResponseAnalytics form={form} items={items} />

                {items.length === 0 ? (
                    <div className="mc-panel rounded-md p-16 text-center">
                        <div className="mc-block bg-stone w-14 h-14 mx-auto mb-4" />
                        <h3 className="font-pixel text-sm">NO RESPONSES YET</h3>
                        <p className="font-mc text-lg text-muted-foreground mt-2">
                            Share your form link to start mining feedback.
                        </p>
                        <Link href={`/f/${form.id}`} className="inline-block mt-5">
                            <button className="mc-block bg-grass text-primary-foreground h-10 px-5 font-pixel text-[10px]">
                                OPEN PUBLIC FORM
                            </button>
                        </Link>
                    </div>
                ) : (
                    <div className="mc-panel rounded-md overflow-hidden">
                        <div className="px-4 py-3 border-b border-border">
                            <div className="font-pixel text-[10px] text-primary">
                                {"// RAW RESPONSES"}
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        <th className="text-left font-pixel text-[9px] px-4 py-3">
                                            SUBMITTED
                                        </th>
                                        {form.fields.map((f) => (
                                            <th
                                                key={f.id}
                                                className="text-left font-pixel text-[9px] px-4 py-3"
                                            >
                                                {f.label.toUpperCase()}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((r) => (
                                        <tr key={r.id} className="border-t border-border">
                                            <td className="px-4 py-3 font-mc text-base text-muted-foreground whitespace-nowrap">
                                                {new Date(r.submittedAt).toLocaleString()}
                                            </td>
                                            {form.fields.map((f) => (
                                                <td
                                                    key={f.id}
                                                    className="px-4 py-3 font-mc text-base max-w-xs truncate"
                                                >
                                                    {labelForValue(f.id, r.values[f.id])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="mc-panel rounded-md p-5 flex items-center gap-4">
            <div className="mc-block w-12 h-12" style={{ background: color }} />
            <div>
                <div className="font-pixel text-[9px] text-muted-foreground">
                    {label.toUpperCase()}
                </div>
                <div className="font-pixel text-2xl mt-1">{value}</div>
            </div>
        </div>
    );
}
