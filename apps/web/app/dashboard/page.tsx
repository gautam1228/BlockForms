"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, Trash2, Pencil, BarChart3, Eye, EyeOff, Loader2 } from "lucide-react";

import { SiteLayout } from "~/components/site-layout";
import { useCreateDraft, useDeleteForm, useListMyForms } from "~/hooks/api/form";
import { useSubmissionCountForForm, useTotalSubmissionCount } from "~/hooks/api/submission";
import { useRequireAuth } from "~/hooks/auth/use-require-auth";
import { apiListItemToFormDoc } from "~/lib/forms/mappers";
import { notifyActionError } from "~/lib/notify-action-error";
import { toast } from "~/lib/toast";

const UNPUBLISH_TO_EDIT_MSG = "Unpublish the form to edit it.";

export default function DashboardPage() {
    const router = useRouter();
    const { isCheckingAuth, isAuthenticated } = useRequireAuth();
    const { forms: apiForms, isLoading, isError, refetch } = useListMyForms();
    const { createDraftAsync, isPending: isCreating } = useCreateDraft();
    const { deleteFormAsync, isPending: isDeleting } = useDeleteForm();

    const forms: ReturnType<typeof apiListItemToFormDoc>[] = apiForms.map(apiListItemToFormDoc);

    const create = async () => {
        try {
            const created = await createDraftAsync({});
            toast.success("Draft created");
            router.push(`/builder/${created.id}`);
        } catch (error) {
            notifyActionError(error, "Something went wrong while creating your form.");
        }
    };

    const published = forms.filter((f) => f.published).length;
    const formIds = forms.map((f) => f.id);
    const { total: totalResponses, isLoading: isLoadingCounts } = useTotalSubmissionCount(formIds);

    if (isCheckingAuth || !isAuthenticated) {
        return (
            <SiteLayout>
                <div className="min-h-[40vh] grid place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SiteLayout>
        );
    }

    return (
        <SiteLayout>
            <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                    <div>
                        <div className="font-pixel text-[10px] text-primary mb-2">
                            {"// YOUR WORKSHOP"}
                        </div>
                        <h1 className="font-pixel text-xl sm:text-2xl">DASHBOARD</h1>
                        <p className="font-mc text-xl text-muted-foreground mt-1">
                            Forge, publish, and review.
                        </p>
                    </div>
                    <button
                        onClick={create}
                        disabled={isCreating}
                        className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px] inline-flex items-center gap-2 disabled:opacity-60"
                    >
                        {isCreating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                        NEW FORM
                    </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mb-10">
                    <StatCard label="Total forms" value={forms.length} color="var(--grass)" />
                    <StatCard label="Published" value={published} color="var(--gold)" />
                    <StatCard
                        label="Responses"
                        value={isLoadingCounts ? 0 : totalResponses}
                        color="var(--diamond)"
                    />
                </div>

                {isLoading ? (
                    <div className="py-20 grid place-items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : isError ? (
                    <div className="mc-panel rounded-md p-10 text-center">
                        <p className="font-mc text-lg text-muted-foreground">
                            Failed to load your forms.
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
                        <div className="mc-block bg-dirt w-16 h-16 mx-auto mb-5" />
                        <h3 className="font-pixel text-sm">NO FORMS YET</h3>
                        <p className="font-mc text-lg text-muted-foreground mt-2 mb-6">
                            Mine your first form to get started.
                        </p>
                        <button
                            onClick={create}
                            disabled={isCreating}
                            className="mc-block bg-grass text-primary-foreground h-11 px-5 font-pixel text-[10px] inline-flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" /> CREATE FORM
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {forms.map((f) => (
                            <FormCard
                                key={f.id}
                                form={f}
                                isDeleting={isDeleting}
                                onDelete={async () => {
                                    if (!confirm(`Delete "${f.title}"?`)) return;
                                    try {
                                        await deleteFormAsync({ id: f.id });
                                        toast.success("Form deleted");
                                    } catch (error) {
                                        notifyActionError(
                                            error,
                                            "Something went wrong while deleting your form.",
                                        );
                                    }
                                }}
                            />
                        ))}
                    </div>
                )}
            </section>
        </SiteLayout>
    );
}

function FormCard({
    form,
    onDelete,
    isDeleting,
}: {
    form: ReturnType<typeof apiListItemToFormDoc>;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    const router = useRouter();
    const { count: resp } = useSubmissionCountForForm(form.id);

    return (
        <div className="mc-panel rounded-md p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h3 className="font-pixel text-xs truncate">{form.title.toUpperCase()}</h3>
                    <p className="font-mc text-base text-muted-foreground line-clamp-2 mt-1">
                        {form.description || "No description"}
                    </p>
                </div>
                <span
                    className={`shrink-0 inline-flex items-center gap-1 font-pixel text-[8px] px-2 py-1 rounded-sm ${
                        form.published ? "bg-grass text-white" : "bg-muted text-muted-foreground"
                    }`}
                >
                    {form.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {form.published ? "LIVE" : "DRAFT"}
                </span>
            </div>

            <div className="flex items-center gap-4 font-mc text-base text-muted-foreground border-t border-border pt-3 mt-auto">
                <span>{form.visibility === "PUBLIC" ? "Public" : "Unlisted"}</span>
                <span>·</span>
                <span>{resp} responses</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-3">
                <button
                    type="button"
                    onClick={() => {
                        if (form.published) {
                            toast.info(UNPUBLISH_TO_EDIT_MSG);
                        }
                        router.push(`/builder/${form.id}`);
                    }}
                    className="mc-block bg-stone h-9 grid place-items-center"
                    title="Edit"
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <Link
                    href={`/responses/${form.id}`}
                    className="mc-block bg-diamond h-9 grid place-items-center"
                    title="Responses"
                >
                    <BarChart3 className="h-3.5 w-3.5" />
                </Link>
                <Link
                    href={`/f/${form.id}`}
                    className="mc-block bg-gold h-9 grid place-items-center"
                    title="Open public form"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="mc-block bg-redstone text-white h-9 grid place-items-center disabled:opacity-60"
                    title="Delete"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="mc-panel rounded-md p-5 flex items-center gap-4">
            <div className="mc-block w-14 h-14" style={{ background: color }} />
            <div>
                <div className="font-pixel text-[9px] text-muted-foreground">
                    {label.toUpperCase()}
                </div>
                <div className="font-pixel text-2xl mt-1">{value}</div>
            </div>
        </div>
    );
}
