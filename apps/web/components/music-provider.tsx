"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import {
    BGM_TRACKS,
    CLICK_SOUND_SRC,
    DEFAULT_BGM_TRACK_ID,
    getBgmTrack,
    type BgmTrackId,
} from "~/lib/audio/bgm-tracks";
import { findClickableTarget } from "~/lib/audio/clickable-target";

interface MusicCtx {
    playing: boolean;
    trackId: BgmTrackId;
    setTrackId: (id: BgmTrackId) => void;
    toggle: () => void;
    playClick: () => void;
}

const Ctx = createContext<MusicCtx>({
    playing: false,
    trackId: DEFAULT_BGM_TRACK_ID,
    setTrackId: () => {},
    toggle: () => {},
    playClick: () => {},
});

const MUSIC_ON_KEY = "mc_music_on_v1";
const BGM_TRACK_KEY = "mc_bgm_track_v1";

function readStoredTrackId(): BgmTrackId {
    if (typeof window === "undefined") return DEFAULT_BGM_TRACK_ID;
    try {
        const stored = localStorage.getItem(BGM_TRACK_KEY);
        if (stored && BGM_TRACKS.some((t) => t.id === stored)) {
            return stored as BgmTrackId;
        }
    } catch {
        /* noop */
    }
    return DEFAULT_BGM_TRACK_ID;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
    const [playing, setPlaying] = useState(false);
    const [trackId, setTrackIdState] = useState<BgmTrackId>(DEFAULT_BGM_TRACK_ID);
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const clickRef = useRef<HTMLAudioElement | null>(null);
    const playingRef = useRef(false);

    const playClick = useCallback(() => {
        if (!clickRef.current) {
            clickRef.current = new Audio(CLICK_SOUND_SRC);
            clickRef.current.volume = 0.45;
        }
        const click = clickRef.current;
        click.currentTime = 0;
        void click.play().catch(() => {});
    }, []);

    const startBgm = useCallback((id: BgmTrackId) => {
        const track = getBgmTrack(id);
        if (!bgmRef.current) {
            bgmRef.current = new Audio();
            bgmRef.current.loop = true;
            bgmRef.current.volume = 0.35;
        }
        bgmRef.current.src = track.src;
        return bgmRef.current.play();
    }, []);

    const stopBgm = useCallback(() => {
        if (!bgmRef.current) return;
        bgmRef.current.pause();
        bgmRef.current.currentTime = 0;
    }, []);

    const setTrackId = useCallback((id: BgmTrackId) => {
        setTrackIdState(id);
        try {
            localStorage.setItem(BGM_TRACK_KEY, id);
        } catch {
            /* noop */
        }
        if (playingRef.current && bgmRef.current) {
            const track = getBgmTrack(id);
            bgmRef.current.src = track.src;
            bgmRef.current.currentTime = 0;
            void bgmRef.current.play().catch(() => {});
        }
    }, []);

    const toggle = useCallback(() => {
        if (playingRef.current) {
            stopBgm();
            playingRef.current = false;
            setPlaying(false);
            try {
                localStorage.setItem(MUSIC_ON_KEY, "0");
            } catch {
                /* noop */
            }
            return;
        }

        void startBgm(trackId)
            .then(() => {
                playingRef.current = true;
                setPlaying(true);
                try {
                    localStorage.setItem(MUSIC_ON_KEY, "1");
                } catch {
                    /* noop */
                }
            })
            .catch(() => {
                playingRef.current = false;
                setPlaying(false);
            });
    }, [startBgm, stopBgm, trackId]);

    useEffect(() => {
        const storedTrack = readStoredTrackId();
        setTrackIdState(storedTrack);
        try {
            if (localStorage.getItem(MUSIC_ON_KEY) === "0") return;
            void startBgm(storedTrack)
                .then(() => {
                    playingRef.current = true;
                    setPlaying(true);
                    localStorage.setItem(MUSIC_ON_KEY, "1");
                })
                .catch(() => {
                    localStorage.setItem(MUSIC_ON_KEY, "0");
                });
        } catch {
            /* noop */
        }
    }, [startBgm]);

    useEffect(() => {
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) return;
            if (target.closest("[data-skip-click-sound]")) return;
            if (findClickableTarget(target)) playClick();
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [playClick]);

    useEffect(() => {
        return () => {
            stopBgm();
            bgmRef.current = null;
        };
    }, [stopBgm]);

    return (
        <Ctx.Provider value={{ playing, trackId, setTrackId, toggle, playClick }}>
            {children}
        </Ctx.Provider>
    );
}

export const useMusic = () => useContext(Ctx);
