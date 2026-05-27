import { z } from "zod";

/** Preset profile portraits (hosted externally). */
export const PROFILE_AVATARS = [
    {
        id: "avatar_1",
        label: "Adventurer I",
        url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExN2RnYjRlbXh2cHZvbzUwcmkxYjVnbmJydWF6a2RkbjljMjJiM2FmdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/RYF3cIJiNA3Wn2La47/giphy.gif",
    },
    {
        id: "avatar_2",
        label: "Adventurer II",
        url: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcXk0cnZrZ2VhNXN1aXB3b3QxaDd5dnh6NWJzZXZ2bXZzMDRyazV0OCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WiNg1POvrstJbyLOpQ/giphy.gif",
    },
    {
        id: "avatar_3",
        label: "Adventurer III",
        url: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcjRxNXA1OW0wOTQ5N3dqZ3hqenA2a2txZWpud3Ricnc5NTNveWM5aiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GZAtsi32qYxdlE8X0w/giphy.gif",
    },
    {
        id: "avatar_4",
        label: "Adventurer IV",
        url: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmZoc2VxOXJydHYwN2lmOGQyMmJlaGd4eXJ6dGczdWt4M3h0ZzFlZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/6LkqKOn3RSfvBB5vSu/giphy.gif",
    },
    {
        id: "avatar_5",
        label: "Adventurer V",
        url: "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzcxZGp2Njdmd2JncDhzZWJqeG83amoxNXRhdDZtNWxlM3hleTdlZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/zCq3TyuABrRrG/giphy.gif",
    },
] as const;

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]["id"];

export const PROFILE_AVATAR_IDS = PROFILE_AVATARS.map((a) => a.id) as [
    ProfileAvatarId,
    ...ProfileAvatarId[],
];

export const PROFILE_AVATAR_URLS = PROFILE_AVATARS.map((a) => a.url);

const profileAvatarUrlById = new Map<string, string>(PROFILE_AVATARS.map((a) => [a.id, a.url]));
const profileAvatarIdByUrl = new Map<string, ProfileAvatarId>(
    PROFILE_AVATARS.map((a) => [a.url, a.id]),
);

/** Plain Zod enum — safe for tRPC/OpenAPI input models (no `.refine()`). */
export const profileAvatarIdSchema = z.enum(PROFILE_AVATAR_IDS);

export const profileAvatarIdInputSchema = z.union([profileAvatarIdSchema, z.literal(""), z.null()]);

export function getProfileAvatarUrl(id: ProfileAvatarId): string {
    return profileAvatarUrlById.get(id)!;
}

export function findProfileAvatarIdByUrl(url: string | null | undefined): ProfileAvatarId | null {
    if (!url) return null;
    return profileAvatarIdByUrl.get(url) ?? null;
}

export function isAllowedProfileAvatarUrl(url: string | null | undefined): boolean {
    if (!url) return true;
    return profileAvatarIdByUrl.has(url);
}

export function resolveProfileAvatarId(
    profileAvatarId: string | null | "" | undefined,
): string | null | undefined {
    if (profileAvatarId === undefined) return undefined;
    if (profileAvatarId === "" || profileAvatarId === null) return null;
    const parsed = profileAvatarIdSchema.safeParse(profileAvatarId);
    if (!parsed.success) return undefined;
    return getProfileAvatarUrl(parsed.data);
}
