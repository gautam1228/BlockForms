export const CLICK_SOUND_SRC = "/CLICK_stone-effect.mp3";

export const BGM_TRACKS = [
    {
        id: "mice-on-venus",
        label: "Mice on Venus",
        src: "/BGM_Mice-on-Venus.mp3",
    },
    {
        id: "minecraft",
        label: "Minecraft",
        src: "/BGM_Minecraft.mp3",
    },
    {
        id: "subwoofer-lullaby",
        label: "Subwoofer Lullaby",
        src: "/BGM_Subwoofer-Lullaby.mp3",
    },
    {
        id: "wet-hands",
        label: "Wet Hands",
        src: "/BGM_Wet-Hands.mp3",
    },
] as const;

export type BgmTrackId = (typeof BGM_TRACKS)[number]["id"];

export const DEFAULT_BGM_TRACK_ID: BgmTrackId = "minecraft";

export function getBgmTrack(id: string) {
    return BGM_TRACKS.find((t) => t.id === id) ?? BGM_TRACKS[0]!;
}
