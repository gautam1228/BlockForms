"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    Plus,
    Trash2,
    GripVertical,
    ArrowLeft,
    Eye,
    Copy,
    Send,
    Loader2,
    CloudUpload,
} from "lucide-react";
import { toast } from "~/lib/toast";

import { SiteLayout } from "~/components/site-layout";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import {
    BuilderFieldTypes,
    FIELD_LABELS,
    themeStyles,
    type FieldType,
    type FormDoc,
    type FormField,
    type FormFieldOption,
    type FormVisibility,
    type ThemeName,
} from "~/components/forms/types";
import {
    useMyFormById,
    usePublishForm,
    useSaveDraft,
    useUnpublishForm,
    useUpdateFormSettings,
} from "~/hooks/api/form";
import { useRequireAuth } from "~/hooks/auth/use-require-auth";
import {
    clearDraftFromStorage,
    loadDraftFromStorage,
    saveDraftToStorage,
} from "~/lib/forms/draft-storage";
import { apiFormDetailToFormDoc, formDocToSaveDraftInput, uiThemeToApi } from "~/lib/forms/mappers";
import {
    ensureFieldIndices,
    indexForNewField,
    moveFieldByIndex,
    sortFieldsByIndex,
} from "~/lib/forms/field-index";
import { notifyActionError } from "~/lib/notify-action-error";
import { trpc } from "~/trpc/client";

const UNPUBLISH_TO_EDIT_MSG = "Unpublish the form to edit it.";

function newId(prefix = "id") {
    return `${prefix}_${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10)}`;
}

export default function BuilderPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const id = params.id;

    const { isCheckingAuth, isAuthenticated } = useRequireAuth();
    const { data, isLoading, isError } = useMyFormById(id);
    const { saveDraftAsync, isPending: isSaving } = useSaveDraft();
    const { publishFormAsync, isPending: isPublishing } = usePublishForm();
    const { unpublishFormAsync, isPending: isUnpublishing } = useUnpublishForm();
    const { updateFormSettingsAsync, isPending: isUpdatingSettings } = useUpdateFormSettings();
    const utils = trpc.useUtils();

    const [form, setForm] = useState<FormDoc | null>(null);
    const [passwordInput, setPasswordInput] = useState("");
    const [publishVisibility, setPublishVisibility] = useState<FormVisibility>("UNLISTED");
    const [localSavedAt, setLocalSavedAt] = useState<number | null>(null);
    const [dbSyncedAt, setDbSyncedAt] = useState<number | null>(null);
    const [hasLocalChanges, setHasLocalChanges] = useState(false);
    const [pendingLocalSave, setPendingLocalSave] = useState(false);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const formRef = useRef<FormDoc | null>(null);
    const loadedFormIdRef = useRef<string | null>(null);

    useEffect(() => {
        loadedFormIdRef.current = null;
    }, [id]);

    useEffect(() => {
        if (!data || loadedFormIdRef.current === id) return;
        loadedFormIdRef.current = id;

        const fromApi = apiFormDetailToFormDoc(data);
        const fromLocal = loadDraftFromStorage(id);

        const base = fromLocal && fromApi.status === "DRAFT" ? fromLocal : fromApi;
        const doc = { ...base, fields: ensureFieldIndices(base.fields) };

        setForm(doc);
        formRef.current = doc;
        setPublishVisibility(doc.visibility);
        setDbSyncedAt(new Date(data.updatedAt).getTime());
        setHasLocalChanges(Boolean(fromLocal && fromApi.status === "DRAFT"));
        setLocalSavedAt(fromLocal ? Date.now() : null);
    }, [data, id]);

    const persistLocal = useCallback((doc: FormDoc) => {
        if (doc.status !== "DRAFT") return;
        saveDraftToStorage(doc);
        setLocalSavedAt(Date.now());
        setHasLocalChanges(true);
    }, []);

    const notifyUnpublishRequired = useCallback(() => {
        toast.info(UNPUBLISH_TO_EDIT_MSG);
    }, []);

    const save = useCallback(
        (next: FormDoc) => {
            if (next.status !== "DRAFT") {
                notifyUnpublishRequired();
                return;
            }

            setForm(next);
            formRef.current = next;

            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            setPendingLocalSave(true);
            saveTimerRef.current = setTimeout(() => {
                persistLocal(next);
                setPendingLocalSave(false);
            }, 500);
        },
        [persistLocal, notifyUnpublishRequired],
    );

    const syncToDb = useCallback(async () => {
        const doc = formRef.current;
        if (!doc || doc.status !== "DRAFT") return;
        try {
            await saveDraftAsync(formDocToSaveDraftInput(doc));
            const fresh = await utils.form.getMyFormById.fetch({ id: doc.id });
            const synced = apiFormDetailToFormDoc(fresh);
            setForm(synced);
            formRef.current = synced;
            setDbSyncedAt(Date.now());
            setHasLocalChanges(false);
            clearDraftFromStorage(doc.id);
            toast.success("Synced to DB");
        } catch (error) {
            notifyActionError(error, "Something went wrong while saving your form.");
        }
    }, [saveDraftAsync, utils.form.getMyFormById]);

    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    const formId = form?.id;
    const shareUrl = useMemo(
        () =>
            typeof window === "undefined" || !formId ? "" : `${window.location.origin}/f/${formId}`,
        [formId],
    );
    const sortedFields = useMemo(() => (form ? sortFieldsByIndex(form.fields) : []), [form]);

    if (isCheckingAuth || !isAuthenticated) {
        return (
            <SiteLayout hideFooter>
                <div className="min-h-[40vh] grid place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SiteLayout>
        );
    }

    if (isLoading) {
        return (
            <SiteLayout hideFooter>
                <div className="min-h-[40vh] grid place-items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </SiteLayout>
        );
    }

    if (isError || !form) {
        return (
            <SiteLayout hideFooter>
                <div className="mx-auto max-w-lg px-4 py-20 text-center">
                    <h1 className="font-pixel text-base">FORM NOT FOUND</h1>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="mc-block bg-stone h-10 px-4 font-pixel text-[10px] mt-6"
                    >
                        BACK TO DASHBOARD
                    </button>
                </div>
            </SiteLayout>
        );
    }

    const addField = (type: FieldType) => {
        if (form.status !== "DRAFT") {
            notifyUnpublishRequired();
            return;
        }
        const field: FormField = {
            id: newId("f"),
            type,
            label: FIELD_LABELS[type],
            required: false,
            index: indexForNewField(form.fields),
            ...((type === "single_choice" || type === "multi_choice") && {
                options: [
                    { id: newId("opt"), label: "Option 1" },
                    { id: newId("opt"), label: "Option 2" },
                ],
            }),
        };
        save({ ...form, fields: [...form.fields, field] });
    };

    const updateField = (fid: string, patch: Partial<FormField>) => {
        if (form.status !== "DRAFT") {
            notifyUnpublishRequired();
            return;
        }
        save({
            ...form,
            fields: form.fields.map((f) => (f.id === fid ? { ...f, ...patch } : f)),
        });
    };

    const removeField = (fid: string) => {
        if (form.status !== "DRAFT") {
            notifyUnpublishRequired();
            return;
        }
        save({ ...form, fields: form.fields.filter((f) => f.id !== fid) });
    };

    const move = (idx: number, dir: -1 | 1) => {
        if (form.status !== "DRAFT") {
            notifyUnpublishRequired();
            return;
        }
        const fields = moveFieldByIndex(form.fields, idx, dir);
        save({ ...form, fields });
    };

    const onThemeChange = async (theme: ThemeName) => {
        const next = { ...form, theme };
        setForm(next);
        formRef.current = next;

        if (form.status === "DRAFT") {
            save(next);
            return;
        }

        try {
            await updateFormSettingsAsync({
                id: form.id,
                theme: uiThemeToApi(theme),
            });
            toast.success("Theme updated");
        } catch (error) {
            notifyActionError(error, "Something went wrong while updating the theme.");
        }
    };

    const togglePublish = async () => {
        try {
            if (form.published) {
                await unpublishFormAsync({ id: form.id });
                setForm((prev) => (prev ? { ...prev, published: false, status: "DRAFT" } : prev));
                toast.success("Form unpublished");
            } else {
                await publishFormAsync({
                    id: form.id,
                    visibility: publishVisibility,
                });
                setForm((prev) =>
                    prev
                        ? {
                              ...prev,
                              published: true,
                              status: "PUBLISHED",
                              visibility: publishVisibility,
                          }
                        : prev,
                );
                clearDraftFromStorage(form.id);
                setHasLocalChanges(false);
                toast.success("Form is now LIVE");
            }
        } catch (error) {
            notifyActionError(error, "Something went wrong while updating publish status.");
        }
    };

    const onRequiresLoginChange = async (checked: boolean) => {
        try {
            await updateFormSettingsAsync({ id: form.id, requiresLogin: checked });
            setForm((prev) => (prev ? { ...prev, requiresLogin: checked } : prev));
            toast.success(checked ? "Login required to submit" : "Anyone can submit");
        } catch (error) {
            notifyActionError(error, "Something went wrong while updating form settings.");
        }
    };

    const applyPassword = async () => {
        try {
            if (!passwordInput.trim()) {
                await updateFormSettingsAsync({ id: form.id, password: null });
                setForm((prev) => (prev ? { ...prev, hasPassword: false } : prev));
                setPasswordInput("");
                toast.success("Password protection removed");
                return;
            }
            await updateFormSettingsAsync({
                id: form.id,
                password: passwordInput.trim(),
            });
            setForm((prev) => (prev ? { ...prev, hasPassword: true } : prev));
            toast.success("Password updated");
        } catch (error) {
            notifyActionError(error, "Something went wrong while updating the password.");
        }
    };

    const isDraft = form.status === "DRAFT";

    return (
        <SiteLayout hideFooter>
            <section className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="font-mc text-base text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                        <ArrowLeft className="h-4 w-4" /> Dashboard
                    </button>
                    <div className="flex flex-wrap gap-2 items-center">
                        <Link
                            href={`/f/${form.id}`}
                            className="mc-block mc-block-stone bg-[var(--stone)] h-10 px-4 font-pixel text-[10px] inline-flex items-center gap-2"
                        >
                            <Eye className="h-3.5 w-3.5" /> PREVIEW
                        </Link>
                        {!form.published && (
                            <Select
                                value={publishVisibility}
                                onValueChange={(v) => setPublishVisibility(v as FormVisibility)}
                            >
                                <SelectTrigger className="h-10 w-[130px] font-pixel text-[9px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="UNLISTED">UNLISTED</SelectItem>
                                    <SelectItem value="PUBLIC">PUBLIC</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <button
                            onClick={togglePublish}
                            disabled={isPublishing || isUnpublishing}
                            className={`mc-block h-10 px-4 font-pixel text-[10px] inline-flex items-center gap-2 ${
                                form.published
                                    ? "bg-[var(--redstone)] text-white"
                                    : "bg-[var(--grass)] text-primary-foreground"
                            }`}
                        >
                            <Send className="h-3.5 w-3.5" />{" "}
                            {form.published ? "UNPUBLISH" : "PUBLISH"}
                        </button>
                    </div>
                </div>

                {form.published && (
                    <div className="mc-panel rounded-md p-3 mb-6 flex items-center gap-3 bg-[var(--grass)]/10">
                        <span className="font-pixel text-[9px] text-primary px-2">LIVE</span>
                        <code className="font-mc text-base truncate flex-1">{shareUrl}</code>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success("Link copied");
                            }}
                            className="mc-block mc-block-stone bg-[var(--stone)] h-8 px-3 font-pixel text-[9px] inline-flex items-center gap-1.5"
                        >
                            <Copy className="h-3 w-3" /> COPY
                        </button>
                    </div>
                )}

                {isDraft && (
                    <div className="sticky top-16 z-30 mb-6 mc-panel rounded-md border-2 border-gold/40 bg-gold/5 px-4 py-3 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mc text-sm">
                                <span className="font-pixel text-[9px] text-gold">DRAFT MODE</span>
                                {pendingLocalSave ? (
                                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Saving locally…
                                    </span>
                                ) : localSavedAt ? (
                                    <span className="text-muted-foreground">
                                        Local save: {new Date(localSavedAt).toLocaleTimeString()}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Edits autosave locally every moment
                                    </span>
                                )}
                                {dbSyncedAt ? (
                                    <span className="text-muted-foreground">
                                        DB sync: {new Date(dbSyncedAt).toLocaleTimeString()}
                                        {hasLocalChanges ? " · pending upload" : ""}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground">
                                        Not synced to DB yet
                                    </span>
                                )}
                                {hasLocalChanges && !pendingLocalSave && (
                                    <span className="font-pixel text-[9px] text-gold animate-pulse">
                                        UNSYNCED CHANGES
                                    </span>
                                )}
                                {isSaving && (
                                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => void syncToDb()}
                                disabled={isSaving || (!hasLocalChanges && Boolean(dbSyncedAt))}
                                className="mc-block mc-block-stone bg-[var(--stone)] h-9 px-3 font-pixel text-[9px] inline-flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <CloudUpload className="h-3.5 w-3.5" />
                                )}
                                SYNC TO DB
                            </button>
                        </div>
                        <p className="font-mc text-xs text-muted-foreground mt-2">
                            Edits autosave locally (including field order). Use Sync to DB when you
                            are ready to persist to the server.
                        </p>
                    </div>
                )}

                <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                    <div className="space-y-4">
                        <div className="mc-panel rounded-md p-5 space-y-3">
                            <div>
                                <Label className="font-mc text-base">Title</Label>
                                <Input
                                    value={form.title}
                                    onChange={(e) => save({ ...form, title: e.target.value })}
                                    className="font-pixel text-xs h-11"
                                    readOnly={!isDraft}
                                    onFocus={() => !isDraft && notifyUnpublishRequired()}
                                />
                            </div>
                            <div>
                                <Label className="font-mc text-base">Description</Label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => save({ ...form, description: e.target.value })}
                                    rows={2}
                                    readOnly={!isDraft}
                                    onFocus={() => !isDraft && notifyUnpublishRequired()}
                                />
                            </div>
                            {!isDraft && (
                                <p className="font-mc text-sm text-muted-foreground">
                                    Unpublish to edit title, description, and fields.
                                </p>
                            )}
                        </div>

                        {sortedFields.map((f, i) => (
                            <div key={f.id} className="mc-panel rounded-md p-4">
                                <div className="flex items-start gap-2">
                                    <div className="flex flex-col gap-1 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => move(i, -1)}
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label="Move up"
                                        >
                                            ▲
                                        </button>
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <button
                                            type="button"
                                            onClick={() => move(i, 1)}
                                            className="text-muted-foreground hover:text-foreground"
                                            aria-label="Move down"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-pixel text-[9px] px-2 py-1 mc-block mc-block-stone bg-[var(--stone)]">
                                                {FIELD_LABELS[f.type].toUpperCase()}
                                            </span>
                                            <span className="font-mc text-sm text-muted-foreground">
                                                #{i + 1}
                                            </span>
                                        </div>
                                        <Input
                                            value={f.label}
                                            onChange={(e) =>
                                                updateField(f.id, { label: e.target.value })
                                            }
                                            placeholder="Question"
                                            className="font-mc text-lg h-11"
                                            readOnly={!isDraft}
                                            onFocus={() => !isDraft && notifyUnpublishRequired()}
                                        />
                                        {(f.type === "short_text" ||
                                            f.type === "long_text" ||
                                            f.type === "email" ||
                                            f.type === "number" ||
                                            f.type === "password") && (
                                            <Input
                                                value={f.placeholder ?? ""}
                                                onChange={(e) =>
                                                    updateField(f.id, {
                                                        placeholder: e.target.value,
                                                    })
                                                }
                                                placeholder="Placeholder (optional)"
                                                readOnly={!isDraft}
                                                onFocus={() =>
                                                    !isDraft && notifyUnpublishRequired()
                                                }
                                            />
                                        )}
                                        {(f.type === "single_choice" ||
                                            f.type === "multi_choice") && (
                                            <ChoiceEditor
                                                field={f}
                                                disabled={!isDraft}
                                                onBlockedEdit={notifyUnpublishRequired}
                                                onChange={(opts) =>
                                                    updateField(f.id, { options: opts })
                                                }
                                            />
                                        )}
                                        {f.type === "number" && (
                                            <div className="flex gap-2">
                                                <Input
                                                    type="number"
                                                    value={f.min ?? ""}
                                                    onChange={(e) =>
                                                        updateField(f.id, {
                                                            min:
                                                                e.target.value === ""
                                                                    ? undefined
                                                                    : Number(e.target.value),
                                                        })
                                                    }
                                                    placeholder="Min"
                                                    readOnly={!isDraft}
                                                    onFocus={() =>
                                                        !isDraft && notifyUnpublishRequired()
                                                    }
                                                />
                                                <Input
                                                    type="number"
                                                    value={f.max ?? ""}
                                                    onChange={(e) =>
                                                        updateField(f.id, {
                                                            max:
                                                                e.target.value === ""
                                                                    ? undefined
                                                                    : Number(e.target.value),
                                                        })
                                                    }
                                                    placeholder="Max"
                                                    readOnly={!isDraft}
                                                    onFocus={() =>
                                                        !isDraft && notifyUnpublishRequired()
                                                    }
                                                />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="flex items-center gap-2 font-mc text-base cursor-pointer">
                                                <Switch
                                                    checked={f.required}
                                                    onCheckedChange={(v) =>
                                                        updateField(f.id, { required: v })
                                                    }
                                                    disabled={!isDraft}
                                                />
                                                Required
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeField(f.id)}
                                                className="text-destructive hover:text-destructive/80 inline-flex items-center gap-1 font-mc text-base"
                                            >
                                                <Trash2 className="h-4 w-4" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <aside className="space-y-4">
                        <div className="mc-panel rounded-md p-5">
                            <h3 className="font-pixel text-[10px] mb-3">ADD FIELD</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {BuilderFieldTypes.map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => addField(t)}
                                        className="mc-block mc-block-stone bg-[var(--stone)] py-2 px-2 font-pixel text-[8px] inline-flex items-center justify-center gap-1"
                                    >
                                        <Plus className="h-3 w-3" /> {FIELD_LABELS[t].toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mc-panel rounded-md p-5 space-y-4">
                            <h3 className="font-pixel text-[10px]">ACCESS</h3>
                            <label className="flex items-center justify-between gap-3 font-mc text-base">
                                <span>Require login to submit</span>
                                <Switch
                                    checked={form.requiresLogin}
                                    onCheckedChange={onRequiresLoginChange}
                                    disabled={isUpdatingSettings}
                                />
                            </label>
                            <div className="space-y-2">
                                <Label className="font-mc text-base">
                                    Form password {form.hasPassword ? "(set)" : ""}
                                </Label>
                                <Input
                                    type="password"
                                    value={passwordInput}
                                    onChange={(e) => setPasswordInput(e.target.value)}
                                    placeholder={
                                        form.hasPassword
                                            ? "Enter new password to rotate"
                                            : "Set a password (optional)"
                                    }
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={applyPassword}
                                        disabled={isUpdatingSettings}
                                        className="mc-block bg-grass text-primary-foreground h-9 px-3 font-pixel text-[9px] flex-1"
                                    >
                                        {form.hasPassword && !passwordInput ? "CLEAR" : "APPLY"}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mc-panel rounded-md p-5">
                            <h3 className="font-pixel text-[10px] mb-3">THEME</h3>
                            <Select
                                value={form.theme}
                                onValueChange={(v) => onThemeChange(v as ThemeName)}
                                disabled={isUpdatingSettings}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {(Object.keys(themeStyles) as ThemeName[]).map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {themeStyles[t].label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="font-mc text-xs text-muted-foreground mt-2">
                                Saved with your form and shown on the public page.
                            </p>
                        </div>

                        <div className="mc-panel rounded-md p-5 text-center">
                            <div className="font-pixel text-[9px] text-muted-foreground mb-1">
                                FIELDS
                            </div>
                            <div className="font-pixel text-2xl">{form.fields.length}</div>
                        </div>
                    </aside>
                </div>
            </section>
        </SiteLayout>
    );
}

function ChoiceEditor({
    field,
    onChange,
    disabled,
    onBlockedEdit,
}: {
    field: FormField;
    onChange: (opts: FormFieldOption[]) => void;
    disabled?: boolean;
    onBlockedEdit?: () => void;
}) {
    const opts = field.options ?? [];
    const block = () => {
        if (disabled) onBlockedEdit?.();
    };
    return (
        <div className="space-y-2">
            {opts.map((o, i) => (
                <div key={o.id ?? i} className="flex gap-2">
                    <Input
                        value={o.label}
                        onChange={(e) => {
                            const next = [...opts];
                            next[i] = { ...o, label: e.target.value };
                            onChange(next);
                        }}
                        readOnly={disabled}
                        onFocus={block}
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (disabled) {
                                onBlockedEdit?.();
                                return;
                            }
                            onChange(opts.filter((_, j) => j !== i));
                        }}
                        className="mc-block bg-[var(--redstone)] text-white h-9 w-9 grid place-items-center"
                        aria-label="Remove option"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={() => {
                    if (disabled) {
                        onBlockedEdit?.();
                        return;
                    }
                    onChange([...opts, { id: newId("opt"), label: `Option ${opts.length + 1}` }]);
                }}
                className="mc-block mc-block-stone bg-[var(--stone)] h-9 px-3 font-pixel text-[9px] inline-flex items-center gap-1"
            >
                <Plus className="h-3 w-3" /> ADD OPTION
            </button>
        </div>
    );
}
