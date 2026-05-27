"use client";

import { Volume2, VolumeX } from "lucide-react";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { useMusic } from "~/components/music-provider";
import { BGM_TRACKS } from "~/lib/audio/bgm-tracks";
import { cn } from "~/lib/utils";

type MusicControlsProps = {
    className?: string;
    /** Show the BGM track dropdown on small screens (navbar hides it below sm). */
    showTrackSelectOnMobile?: boolean;
};

export function MusicControls({ className, showTrackSelectOnMobile = false }: MusicControlsProps) {
    const { playing, toggle, trackId, setTrackId } = useMusic();

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Select value={trackId} onValueChange={(v) => setTrackId(v as typeof trackId)}>
                <SelectTrigger
                    className={cn(
                        "h-9 w-[140px] font-pixel text-[8px] border-2",
                        !showTrackSelectOnMobile && "hidden sm:flex",
                    )}
                    aria-label="Background music track"
                >
                    <SelectValue placeholder="BGM" />
                </SelectTrigger>
                <SelectContent>
                    {BGM_TRACKS.map((track) => (
                        <SelectItem key={track.id} value={track.id} className="font-mc text-base">
                            {track.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Mute music" : "Play music"}
                title={playing ? "Mute music" : "Play music"}
                className="mc-block mc-block-stone h-9 w-9 flex items-center justify-center bg-stone text-foreground"
            >
                {playing ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
        </div>
    );
}
