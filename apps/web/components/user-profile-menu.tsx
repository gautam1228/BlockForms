"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
} from "~/components/ui/sheet";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useSignOut, useUpdateProfile, useUser } from "~/hooks/api/auth";
import { useAuthStatus } from "~/hooks/auth/use-auth-status";
import { notifyActionError } from "~/lib/notify-action-error";
import {
    PROFILE_AVATARS,
    findProfileAvatarIdByUrl,
    getProfileAvatarUrl,
    profileAvatarIdSchema,
} from "~/lib/profile-avatars";
import { cn } from "~/lib/utils";
import { toast } from "~/lib/toast";

const profileFormSchema = z.object({
    fullName: z.string().trim().min(1, "Full name is required").max(80, "Maximum 80 characters"),
    profileAvatarId: z.union([profileAvatarIdSchema, z.literal("")]),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export function UserProfileMenu() {
    const router = useRouter();
    const { showAuthedNav } = useAuthStatus();
    const { user } = useUser();
    const { updateProfileAsync, isPending: isSaving } = useUpdateProfile();
    const { signOutAsync, isPending: isSigningOut } = useSignOut();
    const [profileOpen, setProfileOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            fullName: "",
            profileAvatarId: "",
        },
    });

    const selectedAvatarId = watch("profileAvatarId");
    const previewName = watch("fullName");
    const previewImageUrl = selectedAvatarId ? getProfileAvatarUrl(selectedAvatarId) : "";

    useEffect(() => {
        if (!user || !profileOpen) return;
        reset({
            fullName: user.fullName ?? "",
            profileAvatarId: findProfileAvatarIdByUrl(user.profileImageUrl) ?? "",
        });
    }, [user, profileOpen, reset]);

    if (!showAuthedNav || !user) return null;

    const onSaveProfile = async (values: ProfileFormValues) => {
        try {
            await updateProfileAsync({
                fullName: values.fullName,
                profileAvatarId: values.profileAvatarId || null,
            });
            toast.success("Profile updated");
            setProfileOpen(false);
        } catch (error) {
            notifyActionError(error, "Something went wrong while updating your profile.");
        }
    };

    const onLogout = async () => {
        try {
            await signOutAsync({});
            router.replace("/");
            router.refresh();
        } catch (error) {
            notifyActionError(error, "Something went wrong while signing out.");
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        className="h-9 w-9 shrink-0 overflow-hidden rounded-full p-0 border-0 bg-transparent"
                        aria-label="Account menu"
                    >
                        {user.profileImageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={user.profileImageUrl}
                                alt={user.fullName}
                                className="h-full w-full rounded-full object-cover pixelated"
                            />
                        ) : (
                            <span className="flex h-full w-full items-center justify-center rounded-full bg-gold font-pixel text-[9px] text-foreground">
                                {initials(user.fullName)}
                            </span>
                        )}
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44 rounded-md border-2 p-1">
                    <DropdownMenuItem
                        className="font-mc text-base cursor-pointer"
                        onSelect={() => setProfileOpen(true)}
                    >
                        <UserRound className="h-4 w-4" />
                        Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="font-mc text-base cursor-pointer text-destructive focus:text-destructive"
                        disabled={isSigningOut}
                        onSelect={() => void onLogout()}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
                <SheetContent
                    side="right"
                    className="mc-panel w-full border-l-4 border-grass-dark bg-background sm:max-w-md"
                >
                    <SheetHeader className="border-b border-border pb-4">
                        <SheetTitle className="font-pixel text-sm tracking-wide">
                            EDIT PROFILE
                        </SheetTitle>
                        <SheetDescription className="font-mc text-base">
                            Update your adventurer name and pick a portrait.
                        </SheetDescription>
                    </SheetHeader>

                    <form
                        onSubmit={handleSubmit(onSaveProfile)}
                        className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
                    >
                        <div className="flex flex-col items-center gap-3">
                            <div className="mc-block h-24 w-24 overflow-hidden bg-stone">
                                <Avatar className="h-24 w-24 rounded-none after:rounded-none">
                                    {previewImageUrl ? (
                                        <AvatarImage
                                            src={previewImageUrl}
                                            alt={previewName || user.fullName}
                                        />
                                    ) : null}
                                    <AvatarFallback className="rounded-none bg-gold font-pixel text-lg">
                                        {initials(previewName || user.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <p className="font-mc text-sm text-muted-foreground">Preview</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="profile-fullName" className="font-mc text-base">
                                Full name
                            </Label>
                            <Input
                                id="profile-fullName"
                                className="font-mc text-lg h-11"
                                aria-invalid={Boolean(errors.fullName)}
                                {...register("fullName")}
                            />
                            {errors.fullName && (
                                <p className="font-mc text-sm text-destructive" role="alert">
                                    {errors.fullName.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="font-mc text-base">Choose a portrait</Label>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setValue("profileAvatarId", "", { shouldDirty: true })
                                    }
                                    className={cn(
                                        "mc-block aspect-square flex flex-col items-center justify-center gap-1 bg-muted/40 p-2 transition",
                                        selectedAvatarId === "" &&
                                            "ring-2 ring-grass ring-offset-2 ring-offset-background",
                                    )}
                                >
                                    <span className="font-pixel text-[8px] text-muted-foreground">
                                        NONE
                                    </span>
                                </button>
                                {PROFILE_AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        type="button"
                                        onClick={() =>
                                            setValue("profileAvatarId", avatar.id, {
                                                shouldDirty: true,
                                            })
                                        }
                                        className={cn(
                                            "mc-block aspect-square overflow-hidden p-0.5 transition",
                                            selectedAvatarId === avatar.id &&
                                                "ring-2 ring-grass ring-offset-2 ring-offset-background",
                                        )}
                                        title={avatar.label}
                                    >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={avatar.url}
                                            alt={avatar.label}
                                            className="h-full w-full object-cover pixelated"
                                        />
                                    </button>
                                ))}
                            </div>
                            {errors.profileAvatarId && (
                                <p className="font-mc text-sm text-destructive" role="alert">
                                    {errors.profileAvatarId.message}
                                </p>
                            )}
                        </div>

                        <SheetFooter className="mt-auto px-0 pb-0">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="mc-block h-11 w-full bg-grass font-pixel text-[10px] text-primary-foreground disabled:opacity-60"
                            >
                                {isSaving ? "SAVING…" : "SAVE PROFILE"}
                            </button>
                        </SheetFooter>
                    </form>
                </SheetContent>
            </Sheet>
        </>
    );
}
