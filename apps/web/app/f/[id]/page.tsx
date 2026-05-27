"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, CheckCircle2, Mountain, Gem, Flame, Sparkles, Loader2, Lock } from "lucide-react";
import { toast } from "~/lib/toast";

import { Input } from "~/components/ui/input";
import { PasswordInput } from "~/components/ui/password-input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Checkbox } from "~/components/ui/checkbox";
import {
    themeStyles,
    type FormDoc,
    type FormField,
    type ThemeName,
} from "~/components/forms/types";
import { useUser } from "~/hooks/api/auth";
import { usePublishedFormById } from "~/hooks/api/form";
import { useSubmitForm } from "~/hooks/api/submission";
import { apiPublishedFormToFormDoc, buildSubmitAnswers } from "~/lib/forms/mappers";
import { getStoredFormPassword, setStoredFormPassword } from "~/lib/forms/theme-storage";
import { notifyActionError } from "~/lib/notify-action-error";
import { sortFieldsByIndex } from "~/lib/forms/field-index";
import { ThemeScene } from "~/components/theme-scene";
import { MusicControls } from "~/components/music-controls";

const themeUI: Record<
    ThemeName,
    {
        cardBg: string;
        cardBorder: string;
        text: string;
        muted: string;
        inputBg: string;
        inputText: string;
        submitBg: string;
        icon: React.ComponentType<{ className?: string }>;
    }
> = {
    grass: {
        cardBg: "rgba(255,255,255,0.96)",
        cardBorder: "var(--grass-dark)",
        text: "oklch(0.22 0.02 240)",
        muted: "oklch(0.45 0.02 240)",
        inputBg: "white",
        inputText: "oklch(0.22 0.02 240)",
        submitBg: "var(--grass)",
        icon: Mountain,
    },
    stone: {
        cardBg: "rgba(28,30,38,0.92)",
        cardBorder: "var(--stone)",
        text: "oklch(0.95 0.01 95)",
        muted: "oklch(0.75 0.01 240)",
        inputBg: "rgba(255,255,255,0.08)",
        inputText: "white",
        submitBg: "var(--diamond)",
        icon: Gem,
    },
    nether: {
        cardBg: "rgba(40,12,12,0.92)",
        cardBorder: "var(--redstone)",
        text: "oklch(0.97 0.02 60)",
        muted: "oklch(0.82 0.06 60)",
        inputBg: "rgba(255,255,255,0.08)",
        inputText: "white",
        submitBg: "var(--redstone)",
        icon: Flame,
    },
    end: {
        cardBg: "rgba(20,16,40,0.92)",
        cardBorder: "var(--diamond)",
        text: "oklch(0.97 0.01 280)",
        muted: "oklch(0.82 0.03 280)",
        inputBg: "rgba(255,255,255,0.08)",
        inputText: "white",
        submitBg: "var(--diamond)",
        icon: Sparkles,
    },
};

function PublicFormShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative z-[1] grid min-h-screen place-items-center px-4">
            <div className="fixed top-4 left-4 z-50">
                <MusicControls showTrackSelectOnMobile />
            </div>
            {children}
        </div>
    );
}

export default function PublicFormPage() {
    const params = useParams<{ id: string }>();
    const id = params.id;

    const { user, isLoading: isUserLoading, isFetched: isUserFetched } = useUser();
    const [passwordDraft, setPasswordDraft] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [submittedPassword, setSubmittedPassword] = useState<string | undefined>(() =>
        getStoredFormPassword(id),
    );
    const [pendingPasswordCheck, setPendingPasswordCheck] = useState<string | null>(null);

    const {
        data: published,
        isLoading,
        isError,
        isFetching,
    } = usePublishedFormById(id, submittedPassword);

    const { submitFormAsync, isPending: isSubmitting } = useSubmitForm();

    const [values, setValues] = useState<Record<string, unknown>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [done, setDone] = useState(false);

    const form: FormDoc | null = useMemo(
        () => (published ? apiPublishedFormToFormDoc(published) : null),
        [published],
    );

    const theme: ThemeName = form?.theme ?? "grass";
    const t = themeStyles[theme];
    const ui = themeUI[theme];
    const Icon = ui.icon;

    const sortedFields = useMemo(() => (form ? sortFieldsByIndex(form.fields) : []), [form]);

    useEffect(() => {
        if (!form) return;
        setValues((prev) => {
            let changed = false;
            const next = { ...prev };
            for (const f of form.fields) {
                if (f.type === "yes_no" && next[f.id] === undefined) {
                    next[f.id] = false;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [form]);

    const needsSignIn = Boolean(form?.requiresLogin && isUserFetched && !user?.id);
    const needsEmailVerified = Boolean(
        form?.requiresLogin && isUserFetched && user?.id && !user.emailVerified,
    );
    const needsAuth = needsSignIn || needsEmailVerified;
    const needsPassword = Boolean(form?.hasPassword && !published?.accessGranted);
    const canFillForm = Boolean(
        published?.accessGranted && !needsAuth && form && form.fields.length > 0,
    );

    useEffect(() => {
        if (submittedPassword && published?.accessGranted) {
            setStoredFormPassword(id, submittedPassword);
        }
    }, [id, submittedPassword, published?.accessGranted]);

    useEffect(() => {
        if (pendingPasswordCheck === null || isFetching) return;

        if (published?.hasPassword && !published.accessGranted) {
            setPasswordError("Incorrect password. Try again.");
            setSubmittedPassword(undefined);
            setStoredFormPassword(id, "");
        } else if (published?.accessGranted) {
            setPasswordError(null);
            setStoredFormPassword(id, pendingPasswordCheck);
        }
        setPendingPasswordCheck(null);
    }, [published, pendingPasswordCheck, isFetching, id]);

    if (isLoading || isUserLoading) {
        return (
            <PublicFormShell>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </PublicFormShell>
        );
    }

    if (isError || !published || !form) {
        return (
            <PublicFormShell>
                <div className="mc-panel p-10 rounded-md text-center max-w-md">
                    <div className="mc-block bg-redstone w-12 h-12 mx-auto mb-4" />
                    <h1 className="font-pixel text-base">FORM NOT FOUND</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-2">
                        This block doesn&apos;t exist or was broken.
                    </p>
                </div>
            </PublicFormShell>
        );
    }

    if (form.status !== "PUBLISHED") {
        return (
            <PublicFormShell>
                <div className="mc-panel p-10 rounded-md text-center max-w-md">
                    <div className="mc-block bg-gold w-12 h-12 mx-auto mb-4" />
                    <h1 className="font-pixel text-base">FORM IS A DRAFT</h1>
                    <p className="font-mc text-lg text-muted-foreground mt-2">
                        The crafter hasn&apos;t published this form yet.
                    </p>
                </div>
            </PublicFormShell>
        );
    }

    if (done) {
        return (
            <ThemeScene theme={theme} formAnchoredBlocks>
                <div className="fixed top-4 left-4 z-50">
                    <MusicControls showTrackSelectOnMobile />
                </div>
                <div
                    className="rounded-md p-10 text-center"
                        style={{
                            background: ui.cardBg,
                            border: `3px solid ${ui.cardBorder}`,
                            color: ui.text,
                            boxShadow: "0 8px 0 rgba(0,0,0,0.35)",
                        }}
                    >
                        <div className="mc-block bg-grass w-14 h-14 mx-auto mb-5 grid place-items-center">
                            <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="font-pixel text-base">RESPONSE SAVED</h1>
                        <p className="font-mc text-lg mt-2" style={{ color: ui.muted }}>
                            Thanks for filling out this form, adventurer.
                        </p>
                </div>
            </ThemeScene>
        );
    }

    const unlockPassword = (e: React.FormEvent) => {
        e.preventDefault();
        const pwd = passwordDraft.trim();
        if (!pwd) {
            setPasswordError("Enter the form password");
            return;
        }
        setPasswordError(null);
        setPendingPasswordCheck(pwd);
        setSubmittedPassword(pwd);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form || !canFillForm) return;

        const errs: Record<string, string> = {};
        for (const f of form.fields) {
            if (!f.required) continue;
            const v = values[f.id];
            const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
            if (empty) errs[f.id] = "Required";
        }
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error("Please fix the highlighted fields");
            return;
        }
        setErrors({});

        try {
            await submitFormAsync({
                formId: form.id,
                password: submittedPassword,
                answers: buildSubmitAnswers(form, values),
            });
            setDone(true);
        } catch (error) {
            notifyActionError(error, "Something went wrong while submitting the form.");
        }
    };

    return (
        <ThemeScene theme={theme} formAnchoredBlocks>
            <div className="fixed top-4 left-4 z-50">
                <MusicControls showTrackSelectOnMobile />
            </div>
            <div
                className="rounded-md p-8 sm:p-10 backdrop-blur-sm"
                        style={{
                            background: ui.cardBg,
                            border: `3px solid ${ui.cardBorder}`,
                            boxShadow: "0 10px 0 rgba(0,0,0,0.35), 0 0 40px rgba(0,0,0,0.25)",
                            color: ui.text,
                        }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div
                                className="mc-block w-10 h-10 grid place-items-center"
                                style={{ background: t.accent }}
                            >
                                <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-pixel text-[9px]" style={{ color: ui.muted }}>
                                {t.label.toUpperCase()}
                            </span>
                        </div>
                        <h1
                            className="font-pixel text-lg sm:text-xl leading-relaxed"
                            style={{ color: ui.text }}
                        >
                            {form.title}
                        </h1>
                        {form.description && (
                            <p className="font-mc text-xl mt-3" style={{ color: ui.muted }}>
                                {form.description}
                            </p>
                        )}

                        {needsAuth ? (
                            <div className="mt-8 space-y-4 text-center">
                                <p className="font-mc text-lg" style={{ color: ui.muted }}>
                                    {needsSignIn
                                        ? "Sign in to open and submit this form."
                                        : "Verify your email to submit this form."}
                                </p>
                                {needsSignIn ? (
                                    <Link
                                        href={`/login?redirect=${encodeURIComponent(`/f/${id}`)}`}
                                        className="mc-block h-12 inline-flex items-center justify-center px-6 font-pixel text-xs text-white"
                                        style={{ background: ui.submitBg }}
                                    >
                                        SIGN IN
                                    </Link>
                                ) : (
                                    <Link
                                        href="/verify-email/sent"
                                        className="mc-block h-12 inline-flex items-center justify-center px-6 font-pixel text-xs text-white"
                                        style={{ background: ui.submitBg }}
                                    >
                                        VERIFY EMAIL
                                    </Link>
                                )}
                            </div>
                        ) : needsPassword ? (
                            <form onSubmit={unlockPassword} className="mt-8 space-y-4">
                                <div className="flex items-center gap-2 justify-center">
                                    <Lock className="h-4 w-4" style={{ color: ui.muted }} />
                                    <p className="font-mc text-lg" style={{ color: ui.muted }}>
                                        This form is password protected
                                    </p>
                                </div>
                                <PasswordInput
                                    value={passwordDraft}
                                    onChange={(e) => {
                                        setPasswordDraft(e.target.value);
                                        if (passwordError) setPasswordError(null);
                                    }}
                                    placeholder="Enter password"
                                    aria-invalid={Boolean(passwordError)}
                                    style={{
                                        background: ui.inputBg,
                                        color: ui.inputText,
                                        borderColor: passwordError ? "#ff6b6b" : ui.cardBorder,
                                    }}
                                />
                                {passwordError && (
                                    <p
                                        className="font-mc text-base text-center"
                                        style={{ color: "#ff8a8a" }}
                                        role="alert"
                                    >
                                        {passwordError}
                                    </p>
                                )}
                                <button
                                    type="submit"
                                    disabled={isFetching && pendingPasswordCheck !== null}
                                    className="mc-block h-12 w-full font-pixel text-xs text-white disabled:opacity-60"
                                    style={{ background: ui.submitBg }}
                                >
                                    {isFetching && pendingPasswordCheck !== null
                                        ? "CHECKING…"
                                        : "UNLOCK"}
                                </button>
                            </form>
                        ) : canFillForm ? (
                            <form onSubmit={submit} className="mt-8 space-y-6">
                                {sortedFields.map((f, i) => (
                                    <FieldRenderer
                                        key={f.id}
                                        index={i}
                                        field={f}
                                        value={values[f.id]}
                                        error={errors[f.id]}
                                        onChange={(v) => setValues((s) => ({ ...s, [f.id]: v }))}
                                        ui={ui}
                                    />
                                ))}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mc-block h-12 w-full font-pixel text-xs text-white disabled:opacity-60"
                                    style={{ background: ui.submitBg }}
                                >
                                    {isSubmitting ? "SUBMITTING…" : "SUBMIT"}
                                </button>
                                <p
                                    className="text-center font-mc text-sm"
                                    style={{ color: ui.muted }}
                                >
                                    Powered by{" "}
                                    <span className="font-pixel text-[9px]">BLOCKFORMS</span>
                                </p>
                            </form>
                        ) : (
                            <p
                                className="font-mc text-lg mt-8 text-center"
                                style={{ color: ui.muted }}
                            >
                                This form has no questions yet.
                            </p>
                        )}
            </div>
        </ThemeScene>
    );
}

function FieldRenderer({
    field,
    value,
    error,
    onChange,
    index,
    ui,
}: {
    field: FormField;
    value: unknown;
    error?: string;
    onChange: (v: unknown) => void;
    index: number;
    ui: (typeof themeUI)[ThemeName];
}) {
    const inputStyle: React.CSSProperties = {
        background: ui.inputBg,
        color: ui.inputText,
        borderColor: ui.cardBorder,
    };

    const label = (
        <Label className="font-mc text-lg flex items-baseline gap-2" style={{ color: ui.text }}>
            <span className="font-pixel text-[9px]" style={{ color: ui.muted }}>
                {String(index + 1).padStart(2, "0")}
            </span>
            {field.label}
            {field.required && <span style={{ color: "#ff6b6b" }}>*</span>}
        </Label>
    );

    let control: React.ReactNode = null;
    switch (field.type) {
        case "long_text":
            control = (
                <Textarea
                    style={inputStyle}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                />
            );
            break;
        case "email":
            control = (
                <Input
                    style={inputStyle}
                    type="email"
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                />
            );
            break;
        case "password":
            control = (
                <PasswordInput
                    style={inputStyle}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                />
            );
            break;
        case "number":
            control = (
                <Input
                    style={inputStyle}
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={value === undefined || value === "" ? "" : String(value)}
                    onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder={field.placeholder}
                />
            );
            break;
        case "yes_no": {
            const selected = value === true ? "yes" : "no";
            control = (
                <RadioGroup
                    value={selected}
                    onValueChange={(v) => onChange(v === "yes")}
                    className="space-y-2"
                >
                    {(
                        [
                            { id: "yes", label: "Yes" },
                            { id: "no", label: "No" },
                        ] as const
                    ).map((opt) => (
                        <label
                            key={opt.id}
                            className="flex items-center gap-3 font-mc text-lg cursor-pointer rounded-md p-3 transition"
                            style={{
                                background: ui.inputBg,
                                color: ui.inputText,
                                border: `2px solid ${ui.cardBorder}`,
                            }}
                        >
                            <RadioGroupItem value={opt.id} />
                            {opt.label}
                        </label>
                    ))}
                </RadioGroup>
            );
            break;
        }
        case "single_choice":
            control = (
                <RadioGroup
                    value={(value as string) ?? ""}
                    onValueChange={(v) => onChange(v)}
                    className="space-y-2"
                >
                    {(field.options ?? []).map((o) => (
                        <label
                            key={o.id ?? o.label}
                            className="flex items-center gap-3 font-mc text-lg cursor-pointer rounded-md p-3 transition"
                            style={{
                                background: ui.inputBg,
                                color: ui.inputText,
                                border: `2px solid ${ui.cardBorder}`,
                            }}
                        >
                            <RadioGroupItem value={o.id!} />
                            {o.label}
                        </label>
                    ))}
                </RadioGroup>
            );
            break;
        case "multi_choice": {
            const arr = (value as string[]) ?? [];
            control = (
                <div className="space-y-2">
                    {(field.options ?? []).map((o) => {
                        const optionId = o.id!;
                        const checked = arr.includes(optionId);
                        return (
                            <label
                                key={optionId}
                                className="flex items-center gap-3 font-mc text-lg cursor-pointer rounded-md p-3 transition"
                                style={{
                                    background: ui.inputBg,
                                    color: ui.inputText,
                                    border: `2px solid ${ui.cardBorder}`,
                                }}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(c) => {
                                        if (c) onChange([...arr, optionId]);
                                        else onChange(arr.filter((x) => x !== optionId));
                                    }}
                                />
                                {o.label}
                            </label>
                        );
                    })}
                </div>
            );
            break;
        }
        case "rating": {
            const v = Number(value) || 0;
            control = (
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            type="button"
                            key={n}
                            onClick={() => onChange(n)}
                            className={`mc-block h-12 w-12 grid place-items-center ${
                                n <= v ? "bg-gold" : "bg-stone"
                            }`}
                            aria-label={`${n} stars`}
                        >
                            <Star
                                className={`h-4 w-4 ${
                                    n <= v ? "text-white fill-white" : "text-muted-foreground"
                                }`}
                            />
                        </button>
                    ))}
                </div>
            );
            break;
        }
        default:
            control = (
                <Input
                    style={inputStyle}
                    value={(value as string) ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder}
                />
            );
    }

    return (
        <div className="space-y-2">
            {label}
            {control}
            {error && (
                <p className="font-mc text-base" style={{ color: "#ff8a8a" }}>
                    {error}
                </p>
            )}
        </div>
    );
}
